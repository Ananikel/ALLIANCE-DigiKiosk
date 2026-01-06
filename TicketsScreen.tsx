
import React, { useState } from 'react';
import { useTheme, useI18n } from './contexts';
import { MOCK_TICKETS } from './constants';
import { Ticket } from './types';
import { Ticket as TicketIcon, Plus, X } from 'lucide-react';

const TicketsScreen = () => {
    const { t } = useI18n();
    const { theme } = useTheme();
    const isDark = theme === 'blue-dark';

    const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Ticket>>({
        title: '',
        type: 'IT',
        priority: 'MEDIUM',
        customer_name: ''
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const ticket: Ticket = {
            id: Date.now().toString(),
            ticket_no: `TCK-${Math.floor(Math.random() * 1000)}`,
            title: formData.title || '',
            type: formData.type as any,
            priority: formData.priority as any,
            status: 'OPEN',
            customer_name: formData.customer_name,
            created_at: new Date().toISOString().split('T')[0]
        };
        setTickets([ticket, ...tickets]);
        setIsModalOpen(false);
        setFormData({ title: '', type: 'IT', priority: 'MEDIUM', customer_name: '' });
    };

    return (
        <div className="h-full flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('nav.tickets')}</h1>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg transition-transform active:scale-95 ${isDark ? 'bg-dark-primary text-white hover:bg-opacity-90' : 'bg-light-primary text-white hover:bg-opacity-90'}`}
                >
                    <Plus size={18} />
                    {t('tickets.newTicket')}
                </button>
            </div>
            <div className={`flex-1 rounded-xl border overflow-hidden shadow-sm ${isDark ? 'border-gray-700 bg-dark-surface' : 'border-gray-200 bg-white'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className={isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700'}>
                            <tr>
                                <th className="p-4">{t('tickets.id')}</th>
                                <th className="p-4">{t('tickets.subject')}</th>
                                <th className="p-4">{t('tickets.customer')}</th>
                                <th className="p-4">{t('tickets.priority')}</th>
                                <th className="p-4">{t('tickets.status')}</th>
                            </tr>
                        </thead>
                        <tbody className={isDark ? 'divide-y divide-gray-800 text-gray-300' : 'divide-y divide-gray-100 text-gray-700'}>
                             {tickets.map(item => (
                                <tr key={item.id} className={`transition-colors ${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}`}>
                                    <td className="p-4 font-mono text-sm">{item.ticket_no}</td>
                                    <td className="p-4 font-medium">{item.title}</td>
                                    <td className="p-4">{item.customer_name || '-'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold 
                                            ${item.priority === 'HIGH' ? 'bg-red-100 text-red-800' : 
                                              item.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 
                                              'bg-gray-100 text-gray-800'}`}>
                                            {item.priority}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs font-bold">{item.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                  <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-dark-surface text-white' : 'bg-white text-gray-900'}`}>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                          <TicketIcon className="text-light-primary" size={24} />
                          {t('tickets.newTicket')}
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="opacity-70 hover:opacity-100"><X size={24} /></button>
                    </div>
                    <form onSubmit={handleSave} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 opacity-80">{t('tickets.subject')}</label>
                            <input 
                                required
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                className={`w-full p-3 rounded-xl border outline-none ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 opacity-80">{t('tickets.customer')}</label>
                            <input 
                                value={formData.customer_name}
                                onChange={e => setFormData({...formData, customer_name: e.target.value})}
                                className={`w-full p-3 rounded-xl border outline-none ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 opacity-80">Type</label>
                                <select 
                                    value={formData.type}
                                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                                    className={`w-full p-3 rounded-xl border outline-none ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                >
                                    <option value="IT">IT Service</option>
                                    <option value="CUSTOMER_SERVICE">Customer Service</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 opacity-80">{t('tickets.priority')}</label>
                                <select 
                                    value={formData.priority}
                                    onChange={e => setFormData({...formData, priority: e.target.value as any})}
                                    className={`w-full p-3 rounded-xl border outline-none ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-4 flex gap-3">
                             <button type="button" onClick={() => setIsModalOpen(false)} className={`flex-1 py-3 rounded-xl font-bold ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>{t('common.cancel')}</button>
                             <button type="submit" className={`flex-1 py-3 rounded-xl font-bold text-white ${isDark ? 'bg-dark-primary' : 'bg-light-primary'}`}>{t('common.save')}</button>
                        </div>
                    </form>
                  </div>
                </div>
            )}
        </div>
    )
};

export default TicketsScreen;
