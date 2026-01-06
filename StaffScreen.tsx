
import React, { useState } from 'react';
import { useTheme, useI18n, useData } from './contexts';
import { Staff, PermissionCode, RoleDefinition, ItemType } from './types';
import { ALL_PERMISSIONS } from './constants';
import { 
    Users, Plus, X, ShieldCheck, Edit, Trash2, Key, Check, 
    Settings, Package, LayoutGrid
} from 'lucide-react';

const StaffScreen = () => {
    const { t } = useI18n();
    const { theme } = useTheme();
    const { staff, updateStaff, deleteStaff, roles, addRole, deleteRole, catalogItems } = useData();
    const isDark = theme === 'blue-dark';

    const [activeTab, setActiveTab] = useState<'staff' | 'roles'>('staff');
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);

    // Form States
    const [staffForm, setStaffForm] = useState<Partial<Staff>>({});
    const [roleForm, setRoleForm] = useState<Partial<RoleDefinition>>({ permissions: [] });
    const [pin, setPin] = useState('');

    const openStaffModal = (member?: Staff) => {
        if (member) {
            setEditingStaff(member);
            setStaffForm(member);
            setPin(member.pin_hash || '');
        } else {
            setEditingStaff(null);
            const defaultRole = roles.find(r => r.name === 'CASHIER') || roles[0];
            setStaffForm({
                full_name: '',
                role: defaultRole?.name || 'CASHIER',
                permissions: defaultRole?.permissions || [],
                is_active: true,
                assignedItemIds: []
            });
            setPin('');
        }
        setIsStaffModalOpen(true);
    };

    const openRoleModal = (role?: RoleDefinition) => {
        if (role) {
            setEditingRole(role);
            setRoleForm(role);
        } else {
            setEditingRole(null);
            setRoleForm({ name: '', permissions: [] });
        }
        setIsRoleModalOpen(true);
    };

    const handleStaffSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!staffForm.full_name) return;

        // Basic validation for xx-000000 (2 initials + dash + 6 digits)
        const pinRegex = /^[a-z]{2}-\d{6}$/i;
        if (!pinRegex.test(pin)) {
            alert("Format PIN invalide. Utilisez: 2 initiales + tiret + 6 chiffres (ex: sk-123456)");
            return;
        }

        const data: Staff = {
            id: editingStaff ? editingStaff.id : Date.now().toString(),
            full_name: staffForm.full_name || '',
            role: staffForm.role || 'CASHIER',
            permissions: staffForm.permissions || [],
            assignedItemIds: staffForm.assignedItemIds || [],
            is_active: staffForm.is_active !== undefined ? staffForm.is_active : true,
            is_root: editingStaff ? editingStaff.is_root : false,
            ui_language: 'fr',
            ui_theme: 'light',
            pin_hash: pin.toLowerCase()
        };

        updateStaff(data);
        setIsStaffModalOpen(false);
    };

    const handleRoleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleForm.name) return;
        const data: RoleDefinition = {
            id: editingRole ? editingRole.id : Date.now().toString(),
            name: roleForm.name.toUpperCase(),
            permissions: roleForm.permissions || []
        };
        addRole(data);
        setIsRoleModalOpen(false);
    };

    const togglePermission = (perm: PermissionCode, isRole: boolean) => {
        if (isRole) {
            setRoleForm(prev => {
                const perms = prev.permissions || [];
                return { ...prev, permissions: perms.includes(perm) ? perms.filter(p => p !== perm) : [...perms, perm] };
            });
        } else {
            setStaffForm(prev => {
                const perms = prev.permissions || [];
                return { ...prev, permissions: perms.includes(perm) ? perms.filter(p => p !== perm) : [...perms, perm] };
            });
        }
    };

    const toggleItemAssignment = (itemId: string) => {
        setStaffForm(prev => {
            const current = prev.assignedItemIds || [];
            if (current.includes(itemId)) {
                return { ...prev, assignedItemIds: current.filter(id => id !== itemId) };
            } else {
                return { ...prev, assignedItemIds: [...current, itemId] };
            }
        });
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex gap-2 p-1 rounded-xl bg-gray-200 dark:bg-gray-800">
                    <button 
                        onClick={() => setActiveTab('staff')}
                        className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'staff' ? 'bg-white dark:bg-dark-surface shadow-sm text-blue-600 dark:text-blue-400' : 'opacity-50'}`}
                    >
                        {t('nav.staff')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('roles')}
                        className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'roles' ? 'bg-white dark:bg-dark-surface shadow-sm text-blue-600 dark:text-blue-400' : 'opacity-50'}`}
                    >
                        Roles
                    </button>
                </div>
                {activeTab === 'staff' ? (
                    <button onClick={() => openStaffModal()} className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-white shadow-lg active:scale-95 transition-all ${isDark ? 'bg-dark-primary' : 'bg-light-primary'}`}>
                        <Plus size={18} /> {t('staff.addStaff')}
                    </button>
                ) : (
                    <button onClick={() => openRoleModal()} className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-white shadow-lg active:scale-95 transition-all ${isDark ? 'bg-dark-primary' : 'bg-light-primary'}`}>
                        <Plus size={18} /> Add Role
                    </button>
                )}
            </div>

            <div className={`flex-1 rounded-2xl border overflow-hidden shadow-sm flex flex-col ${isDark ? 'border-gray-800 bg-dark-surface' : 'border-gray-200 bg-white'}`}>
                <div className="overflow-x-auto flex-1">
                    {activeTab === 'staff' ? (
                        <table className="w-full text-left">
                            <thead className={`sticky top-0 z-10 ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
                                <tr>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider">{t('staff.name')}</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider">{t('staff.role')}</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider">Assigned items</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-center">{t('staff.active')}</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-center">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-gray-800 text-gray-300' : 'divide-gray-100 text-gray-700'}`}>
                                {staff.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                                        <td className="p-4">
                                            <div className="font-bold">{item.full_name}</div>
                                            <div className="text-[10px] opacity-50 uppercase">{item.is_root ? 'System Root' : 'Staff Member'}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                                {item.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs opacity-70">
                                                {!item.assignedItemIds || item.assignedItemIds.length === 0 ? 'All access' : `${item.assignedItemIds.length} items`}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${item.is_active ? 'bg-green-500/10 text-green-500' : 'bg-gray-100 text-gray-400'}`}>
                                                <Check size={16} />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => openStaffModal(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg active:scale-90"><Edit size={16}/></button>
                                                {!item.is_root && <button onClick={() => window.confirm(t('common.confirmDelete')) && deleteStaff(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg active:scale-90"><Trash2 size={16}/></button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left">
                            <thead className={`sticky top-0 z-10 ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
                                <tr>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider">Role Name</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider">Permissions</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-gray-800 text-gray-300' : 'divide-gray-100 text-gray-700'}`}>
                                {roles.map(role => (
                                    <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                                        <td className="p-4 font-black tracking-widest">{role.name}</td>
                                        <td className="p-4">
                                            <div className="text-[10px] opacity-70">{role.permissions.length} selected</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => openRoleModal(role)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg active:scale-90"><Edit size={16}/></button>
                                                {role.name !== 'ROOT' && <button onClick={() => window.confirm(t('common.confirmDelete')) && deleteRole(role.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg active:scale-90"><Trash2 size={16}/></button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Staff Modal */}
            {isStaffModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                    <div className={`w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isDark ? 'bg-dark-surface text-white' : 'bg-white text-gray-900'}`}>
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${isDark ? 'bg-dark-primary/20 text-dark-primary' : 'bg-light-primary/10 text-light-primary'}`}>
                                    <ShieldCheck size={24} />
                                </div>
                                {editingStaff ? t('staff.editStaff') : t('staff.addStaff')}
                            </h3>
                            <button onClick={() => setIsStaffModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-70 hover:opacity-100"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleStaffSave} className="flex-1 overflow-y-auto p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">{t('staff.name')}</label>
                                        <input required value={staffForm.full_name || ''} onChange={e => setStaffForm({...staffForm, full_name: e.target.value})} className={`w-full px-4 py-3 rounded-2xl border outline-none ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`} placeholder="Ex: Jean Kouassi" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">{t('staff.role')}</label>
                                            <select 
                                                value={staffForm.role}
                                                onChange={e => {
                                                    const role = roles.find(r => r.name === e.target.value);
                                                    setStaffForm({...staffForm, role: e.target.value, permissions: role?.permissions || []});
                                                }}
                                                className={`w-full px-4 py-3 rounded-2xl border outline-none appearance-none ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                            >
                                                {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">{t('staff.pin')}</label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-3.5 opacity-40" size={18} />
                                                <input required type="text" maxLength={9} value={pin} onChange={e => setPin(e.target.value)} className={`w-full pl-10 pr-4 py-3 rounded-2xl border outline-none font-mono text-center tracking-normal text-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`} placeholder="sk-123456" />
                                            </div>
                                            <p className="text-[9px] opacity-40 italic ml-1">Pattern: 2 letters + dash + 6 digits</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Permissions</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {ALL_PERMISSIONS.map(perm => {
                                                const selected = staffForm.permissions?.includes(perm);
                                                return (
                                                    <button type="button" key={perm} onClick={() => togglePermission(perm, false)} className={`p-2 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-2 ${selected ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 'opacity-40 border-gray-200 dark:border-gray-700'}`}>
                                                        <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${selected ? 'bg-blue-500 border-blue-500 text-white' : ''}`}>
                                                            {selected && <Check size={8} strokeWidth={4}/>}
                                                        </div>
                                                        {t(`staff.permissions.${perm}`)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1 flex items-center gap-2">
                                        <Package size={14}/> Assigned Products & Services
                                    </label>
                                    <p className="text-[10px] opacity-40 italic">Select specific items this user is authorized to manage. Leave empty for "All Items" access.</p>
                                    <div className={`rounded-2xl border h-[400px] overflow-y-auto p-4 space-y-2 ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                        {catalogItems.map(item => {
                                            const selected = staffForm.assignedItemIds?.includes(item.id);
                                            return (
                                                <button 
                                                    type="button" 
                                                    key={item.id} 
                                                    onClick={() => toggleItemAssignment(item.id)}
                                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group
                                                        ${selected 
                                                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600' 
                                                            : 'bg-white dark:bg-dark-surface border-gray-100 dark:border-gray-800'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.item_type === ItemType.PRODUCT ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                            {item.item_type === ItemType.PRODUCT ? <Package size={16}/> : <LayoutGrid size={16}/>}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold line-clamp-1">{item.name}</div>
                                                            <div className="text-[9px] opacity-50 uppercase tracking-tighter">{item.category} • {item.price_amount.toLocaleString()} XOF</div>
                                                        </div>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 group-hover:border-emerald-300'}`}>
                                                        {selected && <Check size={12} strokeWidth={3}/>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button type="button" onClick={() => setIsStaffModalOpen(false)} className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest bg-gray-200 dark:bg-gray-700 active:scale-95 transition-all">
                                    {t('common.cancel')}
                                </button>
                                <button type="submit" className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl active:scale-95 transition-all ${isDark ? 'bg-dark-primary' : 'bg-light-primary'}`}>
                                    {t('common.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Role Modal */}
            {isRoleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden ${isDark ? 'bg-dark-surface text-white' : 'bg-white text-gray-900'}`}>
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${isDark ? 'bg-dark-primary/20 text-dark-primary' : 'bg-light-primary/10 text-light-primary'}`}>
                                    <Settings size={24} />
                                </div>
                                {editingRole ? 'Edit Role' : 'Add Role'}
                            </h3>
                            <button onClick={() => setIsRoleModalOpen(false)} className="opacity-50"><X size={24}/></button>
                        </div>
                        <form onSubmit={handleRoleSave} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Role Name</label>
                                <input required value={roleForm.name || ''} onChange={e => setRoleForm({...roleForm, name: e.target.value.toUpperCase()})} placeholder="EX: SERVICE_AGENT" className={`w-full p-3 rounded-2xl border outline-none font-black tracking-widest ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Default Permissions</label>
                                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2">
                                    {ALL_PERMISSIONS.map(perm => (
                                        <button type="button" key={perm} onClick={() => togglePermission(perm, true)} className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${roleForm.permissions?.includes(perm) ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 'opacity-40 border-gray-200 dark:border-gray-700'}`}>
                                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${roleForm.permissions?.includes(perm) ? 'bg-blue-500 border-blue-500 text-white' : ''}`}>
                                                {roleForm.permissions?.includes(perm) && <Check size={10}/>}
                                            </div>
                                            <span className="text-[10px] font-bold uppercase">{t(`staff.permissions.${perm}`)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => setIsRoleModalOpen(false)} className="flex-1 py-4 rounded-2xl font-bold bg-gray-200 dark:bg-gray-700 active:scale-95 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-4 rounded-2xl font-bold text-white bg-blue-500 shadow-xl active:scale-95 transition-all">Save Role</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffScreen;
