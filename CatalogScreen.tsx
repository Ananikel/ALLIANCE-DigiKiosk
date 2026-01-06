
import React, { useState, useMemo } from 'react';
import { useTheme, useI18n, useData } from './contexts';
import { CatalogItem, ItemCategory, ItemType } from './types';
import { 
    Package, Plus, X, Edit, Trash2, Check, Download, 
    Upload, FileText, Smartphone, ClipboardList, Database, AlertCircle 
} from 'lucide-react';

const DIGIKIOSK_PRESETS: Partial<CatalogItem>[] = [
    { name: 'Enregistrement Carte SIM', price_amount: 500, category: ItemCategory.SIM, item_type: ItemType.SERVICE, track_stock: false },
    { name: 'Demande Passeport (Accompagnement)', price_amount: 5000, category: ItemCategory.CUSTOMER_SERVICE, item_type: ItemType.SERVICE, track_stock: false },
    { name: 'Demande Certificat Nationalité', price_amount: 2500, category: ItemCategory.CUSTOMER_SERVICE, item_type: ItemType.SERVICE, track_stock: false },
    { name: 'Saisie de Document (par page)', price_amount: 250, category: ItemCategory.IT_SERVICE, item_type: ItemType.SERVICE, track_stock: false },
    { name: 'Plastification A4', price_amount: 500, category: ItemCategory.IT_SERVICE, item_type: ItemType.SERVICE, track_stock: false },
    { name: 'Recharge Crédit (Générique)', price_amount: 0, category: ItemCategory.RECHARGE, item_type: ItemType.SERVICE, track_stock: false },
    { name: 'iPhone 15 Pro Max', price_amount: 950000, category: ItemCategory.PHONE, item_type: ItemType.PRODUCT, track_stock: true, stock_qty: 2 },
    { name: 'Chargeur Rapide Type-C', price_amount: 7500, category: ItemCategory.ACCESSORY, item_type: ItemType.PRODUCT, track_stock: true, stock_qty: 20 },
];

const CatalogScreen = () => {
    const { t } = useI18n();
    const { theme } = useTheme();
    const { catalogItems: items, setCatalogItems, updateCatalogItem, deleteCatalogItem } = useData();
    const isDark = theme === 'blue-dark';
    
    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'ALL' | 'PRODUCT' | 'SERVICE'>('ALL');
    const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

    // Bulk Import State
    const [importTab, setImportTab] = useState<'PRESETS' | 'JSON'>('PRESETS');
    const [selectedPresets, setSelectedPresets] = useState<number[]>([]);
    const [jsonInput, setJsonInput] = useState('');
    const [importError, setImportError] = useState('');

    const initialItemState: Partial<CatalogItem> = {
        item_type: ItemType.PRODUCT,
        category: ItemCategory.PHONE,
        track_stock: true,
        stock_qty: 0,
        price_amount: 0,
        name: '',
        sku: ''
    };

    const [formState, setFormState] = useState<Partial<CatalogItem>>(initialItemState);

    // Filtering
    const filteredItems = useMemo(() => {
        if (activeTab === 'ALL') return items;
        return items.filter(item => item.item_type === activeTab);
    }, [items, activeTab]);

    const openModal = (item?: CatalogItem) => {
        if (item) {
            setEditingItem(item);
            setFormState(item);
        } else {
            setEditingItem(null);
            setFormState(initialItemState);
        }
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formState.name || formState.price_amount === undefined) return;

        const itemData: CatalogItem = {
            id: editingItem ? editingItem.id : Date.now().toString(),
            sku: formState.sku || `SKU-${Date.now()}`,
            name: formState.name,
            category: formState.category!,
            item_type: formState.item_type!,
            price_amount: Number(formState.price_amount),
            stock_qty: formState.track_stock ? Number(formState.stock_qty || 0) : 0,
            track_stock: !!formState.track_stock
        };

        if (editingItem) {
            updateCatalogItem(itemData);
        } else {
            setCatalogItems([itemData, ...items]);
        }
        
        setIsModalOpen(false);
    };

    const handleBulkImport = () => {
        let itemsToAdd: CatalogItem[] = [];

        if (importTab === 'PRESETS') {
            itemsToAdd = selectedPresets.map(idx => {
                const preset = DIGIKIOSK_PRESETS[idx];
                return {
                    ...preset,
                    id: `preset-${idx}-${Date.now()}`,
                    sku: `PRST-${idx}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                    stock_qty: preset.stock_qty || 0
                } as CatalogItem;
            });
        } else {
            try {
                const parsed = JSON.parse(jsonInput);
                if (!Array.isArray(parsed)) throw new Error('Data must be an array');
                itemsToAdd = parsed.map((item, idx) => ({
                    ...item,
                    id: `imp-${idx}-${Date.now()}`,
                    sku: item.sku || `IMP-${Date.now()}-${idx}`
                }));
            } catch (err: any) {
                setImportError(err.message);
                return;
            }
        }

        setCatalogItems([...itemsToAdd, ...items]);
        setIsImportModalOpen(false);
        setSelectedPresets([]);
        setJsonInput('');
        setImportError('');
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('common.confirmDelete'))) {
            deleteCatalogItem(id);
        }
    };

    const togglePreset = (idx: number) => {
        setSelectedPresets(prev => 
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };
    
    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('nav.catalog')}</h1>
                    <p className="text-xs opacity-50 font-medium">Manage your inventory and service portfolio</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsImportModalOpen(true)}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all active:scale-95 border ${isDark ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                    >
                        <Download size={18} />
                        Import
                    </button>
                    <button 
                        onClick={() => openModal()}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg transition-all active:scale-95 ${isDark ? 'bg-dark-primary text-white hover:bg-opacity-90' : 'bg-light-primary text-white hover:bg-opacity-90'}`}
                    >
                        <Plus size={18} />
                        {t('catalog.addItem')}
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex p-1.5 rounded-2xl w-fit bg-gray-200/50 dark:bg-gray-800/50">
                {[
                    { id: 'ALL', label: 'All Items', icon: ClipboardList },
                    { id: 'PRODUCT', label: 'Products', icon: Smartphone },
                    { id: 'SERVICE', label: 'Services', icon: FileText },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all
                            ${activeTab === tab.id 
                                ? (isDark ? 'bg-dark-surface text-white shadow-lg' : 'bg-white text-light-primary shadow-sm') 
                                : 'opacity-40 hover:opacity-100'
                            }
                        `}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className={`flex-1 rounded-3xl border overflow-hidden shadow-sm flex flex-col ${isDark ? 'border-gray-800 bg-dark-surface' : 'border-gray-100 bg-white'}`}>
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left">
                        <thead className={`sticky top-0 z-10 ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                            <tr>
                                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em]">{t('catalog.name')}</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em]">{t('catalog.category')}</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em]">{t('catalog.type')}</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em]">{t('catalog.price')}</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em]">{t('catalog.stock')}</th>
                                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">{t('catalog.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-gray-800 text-gray-300' : 'divide-y divide-gray-100 text-gray-700'}`}>
                            {filteredItems.map(item => (
                                <tr key={item.id} className={`transition-colors group ${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}`}>
                                    <td className="p-5">
                                        <div className="font-bold text-sm">{item.name}</div>
                                        <div className="text-[10px] opacity-40 font-mono uppercase tracking-tighter mt-0.5">{item.sku}</div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${isDark ? 'bg-gray-800/50 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${item.item_type === ItemType.PRODUCT ? 'text-blue-500' : 'text-purple-500'}`}>
                                            {item.item_type === ItemType.PRODUCT ? <Smartphone size={12}/> : <FileText size={12}/>}
                                            {item.item_type}
                                        </div>
                                    </td>
                                    <td className="p-5 font-black text-sm">
                                        {item.price_amount.toLocaleString()} <span className="text-[10px] opacity-40 font-normal ml-0.5">XOF</span>
                                    </td>
                                    <td className="p-5">
                                        {item.track_stock ? (
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${item.stock_qty <= 5 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                                                <span className={`text-xs font-black ${item.stock_qty <= 5 ? 'text-red-500' : ''}`}>
                                                    {item.stock_qty}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="opacity-20 italic text-[10px]">No tracking</span>
                                        )}
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center justify-center gap-1">
                                            <button 
                                                onClick={() => openModal(item)}
                                                className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${isDark ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-gray-100 text-blue-600'}`}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${isDark ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center opacity-20 italic text-sm">
                                        No items found in this category.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                    <div className={`w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${isDark ? 'bg-dark-surface text-white border border-white/5' : 'bg-white text-gray-900 shadow-blue-900/10'}`}>
                        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                            <div>
                                <h3 className="text-2xl font-black italic tracking-tighter flex items-center gap-3">
                                    <Database className="text-blue-500" size={28} />
                                    Import Catalog Items
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mt-1">Setup your shop in seconds</p>
                            </div>
                            <button onClick={() => setIsImportModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 opacity-50 hover:opacity-100 transition-all"><X size={24} /></button>
                        </div>

                        <div className="p-1 flex bg-gray-100 dark:bg-gray-900/50 mx-8 mt-6 rounded-2xl">
                             <button onClick={() => setImportTab('PRESETS')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${importTab === 'PRESETS' ? 'bg-white dark:bg-dark-surface shadow-lg text-blue-500' : 'opacity-40'}`}>Shop Presets</button>
                             <button onClick={() => setImportTab('JSON')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${importTab === 'JSON' ? 'bg-white dark:bg-dark-surface shadow-lg text-blue-500' : 'opacity-40'}`}>JSON Payload</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            {importTab === 'PRESETS' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {DIGIKIOSK_PRESETS.map((preset, idx) => {
                                        const isSelected = selectedPresets.includes(idx);
                                        return (
                                            <button 
                                                key={idx} 
                                                onClick={() => togglePreset(idx)}
                                                className={`flex items-center gap-4 p-4 rounded-3xl border text-left transition-all
                                                    ${isSelected 
                                                        ? 'bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/10' 
                                                        : 'bg-gray-50/30 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800'
                                                    }
                                                `}
                                            >
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${preset.item_type === ItemType.PRODUCT ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                                    {preset.item_type === ItemType.PRODUCT ? <Smartphone size={18}/> : <FileText size={18}/>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold truncate">{preset.name}</div>
                                                    <div className="text-[10px] font-black uppercase opacity-40">{preset.category} • {preset.price_amount} XOF</div>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-200 opacity-20'}`}>
                                                    {isSelected && <Check size={14} strokeWidth={4} />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-4 h-full flex flex-col">
                                    <div className="flex-1">
                                        <textarea 
                                            value={jsonInput}
                                            onChange={e => setJsonInput(e.target.value)}
                                            placeholder='[{"name": "Item Name", "price_amount": 100, "item_type": "PRODUCT", "category": "PHONE"}]'
                                            className={`w-full h-full min-h-[300px] p-6 rounded-3xl border outline-none font-mono text-xs ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                        />
                                    </div>
                                    {importError && (
                                        <div className="p-4 rounded-2xl bg-red-500/10 text-red-500 text-[10px] font-bold flex items-center gap-2">
                                            <AlertCircle size={14} /> {importError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-black/10 flex gap-4">
                            <button onClick={() => setIsImportModalOpen(false)} className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>Cancel</button>
                            <button 
                                onClick={handleBulkImport}
                                disabled={importTab === 'PRESETS' ? selectedPresets.length === 0 : !jsonInput.trim()}
                                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs text-white shadow-xl shadow-blue-500/20 disabled:opacity-30 disabled:grayscale transition-all ${isDark ? 'bg-dark-primary' : 'bg-blue-600'}`}
                            >
                                Import {importTab === 'PRESETS' ? `${selectedPresets.length} Items` : 'Data'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Standard Item Modal (Add/Edit) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                  <div className={`w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-dark-surface text-white border border-white/5' : 'bg-white text-gray-900'}`}>
                    <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                      <h3 className="text-2xl font-black italic tracking-tighter flex items-center gap-3">
                          <Package className={isDark ? 'text-dark-primary' : 'text-light-primary'} size={28} />
                          {editingItem ? t('catalog.editItem') : t('catalog.addItem')}
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-50 hover:opacity-100">
                        <X size={24} />
                      </button>
                    </div>
                    <form onSubmit={handleSave} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">{t('catalog.name')}</label>
                            <input 
                                required
                                value={formState.name}
                                onChange={e => setFormState({...formState, name: e.target.value})}
                                className={`w-full p-4 rounded-2xl border outline-none transition-all font-bold ${isDark ? 'bg-gray-800 border-gray-700 focus:border-dark-primary' : 'bg-gray-50 border-gray-200 focus:border-light-primary'}`}
                                placeholder="ex: iPhone 13"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">{t('catalog.sku')}</label>
                            <input 
                                value={formState.sku}
                                onChange={e => setFormState({...formState, sku: e.target.value})}
                                className={`w-full p-4 rounded-2xl border outline-none font-mono text-sm tracking-widest ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                placeholder="REF-0000"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">{t('catalog.type')}</label>
                                <div className="relative">
                                    <select 
                                        value={formState.item_type}
                                        onChange={e => {
                                            const type = e.target.value as ItemType;
                                            setFormState({
                                                ...formState, 
                                                item_type: type,
                                                track_stock: type === ItemType.PRODUCT
                                            });
                                        }}
                                        className={`w-full p-4 rounded-2xl border outline-none appearance-none font-bold ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                    >
                                        {Object.values(ItemType).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">{t('catalog.category')}</label>
                                <div className="relative">
                                    <select 
                                        value={formState.category}
                                        onChange={e => setFormState({...formState, category: e.target.value as ItemCategory})}
                                        className={`w-full p-4 rounded-2xl border outline-none appearance-none font-bold ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                    >
                                        {Object.values(ItemCategory).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div 
                            onClick={() => setFormState({...formState, track_stock: !formState.track_stock})}
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${formState.track_stock ? 'border-blue-500/40 bg-blue-500/5' : 'border-gray-100 dark:border-gray-800 opacity-60'}`}
                        >
                             <div className={`w-12 h-7 rounded-full relative transition-all shadow-inner ${formState.track_stock ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
                                <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${formState.track_stock ? 'translate-x-5' : ''}`} />
                             </div>
                             <div>
                                 <div className="text-xs font-black uppercase tracking-widest">{t('catalog.trackStock')}</div>
                                 <div className="text-[10px] opacity-40">Enable inventory count for this item</div>
                             </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                             <div className={formState.track_stock ? '' : 'col-span-2'}>
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">{t('catalog.price')}</label>
                                <div className="relative">
                                    <input 
                                        type="number"
                                        required
                                        min="0"
                                        value={formState.price_amount}
                                        onChange={e => setFormState({...formState, price_amount: Number(e.target.value)})}
                                        className={`w-full p-4 rounded-2xl border outline-none font-black text-xl ${isDark ? 'bg-gray-800 border-gray-700 focus:border-dark-primary' : 'bg-gray-50 border-gray-200 focus:border-light-primary'}`}
                                    />
                                    <span className="absolute right-4 top-4.5 opacity-30 text-xs font-black">XOF</span>
                                </div>
                             </div>
                             {formState.track_stock && (
                                 <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">{t('catalog.stock')}</label>
                                    <input 
                                        type="number"
                                        min="0"
                                        value={formState.stock_qty}
                                        onChange={e => setFormState({...formState, stock_qty: Number(e.target.value)})}
                                        className={`w-full p-4 rounded-2xl border outline-none font-black text-xl ${isDark ? 'bg-gray-800 border-gray-700 focus:border-dark-primary' : 'bg-gray-50 border-gray-200 focus:border-light-primary'}`}
                                    />
                                 </div>
                             )}
                        </div>
                        <div className="pt-6 flex gap-4">
                             <button 
                                type="button" 
                                onClick={() => setIsModalOpen(false)} 
                                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                             >
                                {t('common.cancel')}
                             </button>
                             <button 
                                type="submit" 
                                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs text-white shadow-xl shadow-green-900/20 transition-transform active:scale-95 ${isDark ? 'bg-dark-primary hover:bg-opacity-90' : 'bg-light-primary hover:bg-opacity-90'}`}
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

export default CatalogScreen;
