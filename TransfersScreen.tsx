
import React, { useState } from 'react';
import { useTheme, useI18n } from './contexts';
import { MOCK_TRANSFERS } from './constants';
import { Transfer } from './types';
import { ArrowRightLeft, Plus, X, Edit, Trash2, Phone, DollarSign, ShieldCheck, Clock } from 'lucide-react';

const TransfersScreen = () => {
    const { t } = useI18n();
    const { theme } = useTheme();
    const isDark = theme === 'blue-dark';
    
    // State management
    const [transfers, setTransfers] = useState<Transfer[]>(MOCK_TRANSFERS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);

    // Form Initial State
    const initialFormState: Partial<Transfer> = {
        provider: 'TMONEY',
        type: 'IN',
        amount: 0,
        customer_phone: '',
        fee_amount: 0,
        reference: '',
        status: 'DONE'
    };

    const [formData, setFormData] = useState<Partial<Transfer>>(initialFormState);

    const openModal = (transfer?: Transfer) => {
        if (transfer) {
            setEditingTransfer(transfer);
            setFormData(transfer);
        } else {
            setEditingTransfer(null);
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        const transferData: Transfer = {
            id: editingTransfer ? editingTransfer.id : Date.now().toString(),
            provider: formData.provider as 'TMONEY' | 'FLOOZ',
            type: formData.type as 'IN' | 'OUT',
            amount: Number(formData.amount),
            fee_amount: Number(formData.fee_amount),
            commission_amount: editingTransfer ? editingTransfer.commission_amount : Math.floor(Number(formData.amount) * 0.01), // Mock commission logic
            customer_phone: formData.customer_phone || '',
            reference: formData.reference || `REF-${Date.now().toString().slice(-6)}`,
            status: formData.status as 'DONE' | 'CANCELED',
            created_at: editingTransfer ? editingTransfer.created_at : new Date().toISOString().replace('T', ' ').slice(0, 16)
        };

        if (editingTransfer) {
            setTransfers(prev => prev.map(item => item.id === transferData.id ? transferData : item));
        } else {
            setTransfers([transferData, ...transfers]);
        }

        setIsModalOpen(false);
        setFormData(initialFormState);
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('common.confirmDelete'))) {
            setTransfers(prev => prev.filter(item => item.id !== id));
        }
    };
    
    return (
        <div className="h-full flex flex-col space-y-6">
             {/* Header Section */}
             <div className="flex justify-between items-center">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('transfers.title')}</h1>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {transfers.length} {t('dashboard.transactions')}
                    </p>
                </div>
                <button 
                    onClick={() => openModal()}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg transition-transform active:scale-95 ${isDark ? 'bg-dark-primary text-white hover:bg-opacity-90' : 'bg-light-primary text-white hover:bg-opacity-90'}`}
                >
                    <Plus size={20} />
                    {t('transfers.newTransfer')}
                </button>
            </div>

            {/* Main Table Content */}
            <div className={`flex-1 rounded-2xl border overflow-hidden shadow-sm flex flex-col ${isDark ? 'border-gray-800 bg-dark-surface' : 'border-gray-200 bg-white'}`}>
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left">
                        <thead className={`sticky top-0 z-10 ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
                            <tr>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider">{t('transfers.date')}</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider">{t('transfers.provider')}</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider">{t('transfers.type')}</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider">{t('transfers.phone')}</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-right">{t('transfers.amount')}</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-center">{t('transfers.status')}</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-center">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-gray-800 text-gray-300' : 'divide-gray-100 text-gray-700'}`}>
                             {transfers.map(item => (
                                <tr key={item.id} className={`transition-colors group ${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}`}>
                                    <td className="p-4 font-mono text-xs opacity-60">
                                        {item.created_at}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${item.provider === 'TMONEY' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                                            <span className="font-bold">{item.provider}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border
                                            ${item.type === 'IN' 
                                                ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-700') 
                                                : (isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-orange-50 border-orange-100 text-orange-700')}
                                        `}>
                                            {item.type === 'IN' ? t('transfers.deposit') : t('transfers.withdrawal')}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono font-medium tracking-tight">
                                        {item.customer_phone}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="font-black">
                                            {item.amount.toLocaleString()} <span className="text-[10px] font-normal opacity-50">XOF</span>
                                        </div>
                                        <div className="text-[10px] opacity-40">
                                            {t('transfers.fees')}: {item.fee_amount}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'DONE' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <button 
                                                onClick={() => openModal(item)}
                                                className={`p-2 rounded-lg transition-all hover:scale-110 active:scale-95 ${isDark ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-gray-100 text-blue-600'}`}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                className={`p-2 rounded-lg transition-all hover:scale-110 active:scale-95 ${isDark ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

             {/* Add/Edit Modal */}
             {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 ${isDark ? 'bg-dark-surface text-white' : 'bg-white text-gray-900'}`}>
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                      <h3 className="text-xl font-bold flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${isDark ? 'bg-dark-primary/20 text-dark-primary' : 'bg-light-primary/10 text-light-primary'}`}>
                            <ArrowRightLeft size={24} />
                          </div>
                          {editingTransfer ? t('transfers.provider') : t('transfers.formTitle')}
                      </h3>
                      <button 
                        onClick={() => setIsModalOpen(false)} 
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-70 hover:opacity-100"
                      >
                        <X size={24} />
                      </button>
                    </div>
                    
                    <form onSubmit={handleSave} className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest opacity-60 ml-1">{t('transfers.provider')}</label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-3.5 opacity-40" size={18} />
                                    <select 
                                        value={formData.provider}
                                        onChange={e => setFormData({...formData, provider: e.target.value as any})}
                                        className={`w-full pl-10 pr-4 py-3 rounded-2xl border outline-none appearance-none transition-all focus:ring-2 focus:ring-opacity-50 ${isDark ? 'bg-gray-800 border-gray-700 focus:ring-dark-primary' : 'bg-gray-50 border-gray-200 focus:ring-light-primary'}`}
                                    >
                                        <option value="TMONEY">TMoney (Togocom)</option>
                                        <option value="FLOOZ">Flooz (Moov)</option>
                                    </select>
                                </div>
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest opacity-60 ml-1">{t('transfers.type')}</label>
                                <div className="relative">
                                    <ArrowRightLeft className="absolute left-3 top-3.5 opacity-40" size={18} />
                                    <select 
                                        value={formData.type}
                                        onChange={e => setFormData({...formData, type: e.target.value as any})}
                                        className={`w-full pl-10 pr-4 py-3 rounded-2xl border outline-none appearance-none transition-all focus:ring-2 focus:ring-opacity-50 ${isDark ? 'bg-gray-800 border-gray-700 focus:ring-dark-primary' : 'bg-gray-50 border-gray-200 focus:ring-light-primary'}`}
                                    >
                                        <option value="IN">{t('transfers.deposit')}</option>
                                        <option value="OUT">{t('transfers.withdrawal')}</option>
                                    </select>
                                </div>
                             </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest opacity-60 ml-1">{t('transfers.phone')}</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 opacity-40" size={18} />
                                <input 
                                    required
                                    type="tel"
                                    value={formData.customer_phone}
                                    onChange={e => setFormData({...formData, customer_phone: e.target.value})}
                                    placeholder="90 11 22 33"
                                    className={`w-full pl-10 pr-4 py-3 rounded-2xl border outline-none transition-all focus:ring-2 focus:ring-opacity-50 font-mono text-lg ${isDark ? 'bg-gray-800 border-gray-700 focus:ring-dark-primary' : 'bg-gray-50 border-gray-200 focus:ring-light-primary'}`}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest opacity-60 ml-1">{t('transfers.amount')}</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3.5 opacity-40" size={18} />
                                    <input 
                                        type="number"
                                        required
                                        min="0"
                                        step="100"
                                        value={formData.amount}
                                        onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                                        className={`w-full pl-10 pr-4 py-3 rounded-2xl border outline-none transition-all focus:ring-2 focus:ring-opacity-50 font-bold text-xl ${isDark ? 'bg-gray-800 border-gray-700 focus:ring-dark-primary' : 'bg-gray-50 border-gray-200 focus:ring-light-primary'}`}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest opacity-60 ml-1">{t('transfers.fees')}</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-3.5 opacity-40 font-bold text-xs">XOF</div>
                                    <input 
                                        type="number"
                                        min="0"
                                        value={formData.fee_amount}
                                        onChange={e => setFormData({...formData, fee_amount: Number(e.target.value)})}
                                        className={`w-full pl-10 pr-4 py-3 rounded-2xl border outline-none transition-all focus:ring-2 focus:ring-opacity-50 font-medium ${isDark ? 'bg-gray-800 border-gray-700 focus:ring-dark-primary' : 'bg-gray-50 border-gray-200 focus:ring-light-primary'}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {editingTransfer && (
                             <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest opacity-60 ml-1">{t('transfers.status')}</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3.5 opacity-40" size={18} />
                                    <select 
                                        value={formData.status}
                                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                                        className={`w-full pl-10 pr-4 py-3 rounded-2xl border outline-none appearance-none transition-all focus:ring-2 focus:ring-opacity-50 ${isDark ? 'bg-gray-800 border-gray-700 focus:ring-dark-primary' : 'bg-gray-50 border-gray-200 focus:ring-light-primary'}`}
                                    >
                                        <option value="DONE">DONE</option>
                                        <option value="CANCELED">CANCELED</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex gap-4">
                             <button 
                                type="button" 
                                onClick={() => setIsModalOpen(false)} 
                                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                             >
                                {t('common.cancel')}
                             </button>
                             <button 
                                type="submit" 
                                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 ${isDark ? 'bg-dark-primary hover:bg-opacity-90 shadow-green-900/40' : 'bg-light-primary hover:bg-opacity-90 shadow-green-900/20'}`}
                             >
                                {t('common.save')}
                             </button>
                        </div>
                    </form>
                  </div>
                </div>
            )}
        </div>
    )
};

export default TransfersScreen;
