
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTheme, useI18n, useData } from './contexts';
import { Staff } from './types';

// Page Imports
import AiAssistant from './AiAssistant';
import ExpensesScreen from './ExpensesScreen';
import Dashboard from './Dashboard';
import POSScreen from './POSScreen';
import CatalogScreen from './CatalogScreen';
import TransfersScreen from './TransfersScreen';
import TicketsScreen from './TicketsScreen';
import StaffScreen from './StaffScreen';
import AuditScreen from './AuditScreen';

import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  CreditCard, 
  ArrowRightLeft, 
  Ticket as TicketIcon, 
  Users, 
  LogOut, 
  Sun, 
  Moon, 
  ShieldCheck,
  Sparkles,
  Menu,
  X,
  Save,
  Trash2,
  Key
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active, onClick, colorClass = '', hidden = false }: any) => {
  const { theme } = useTheme();
  if (hidden) return null;
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
        ${active 
          ? (theme === 'blue-dark' ? 'bg-dark-primary text-white border-r-4 border-dark-accent shadow-sm' : 'bg-light-primary text-white border-r-4 border-light-accent shadow-sm')
          : (theme === 'blue-dark' ? 'text-dark-textSec hover:bg-dark-surface' : 'text-gray-600 hover:bg-gray-200')
        }
        ${colorClass}
      `}
    >
      <Icon size={20} className={colorClass ? colorClass : ''} />
      <span className={`font-medium ${colorClass ? colorClass : ''}`}>{label}</span>
    </div>
  );
};

const Layout = ({ children, user, onLogout }: { children?: React.ReactNode, user: Staff | null, onLogout: () => void }) => {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const { catalogItems } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return <Navigate to="/login" />;

  // Permission Checks
  const hasPerm = (code: string) => user.is_root || user.permissions.includes(code as any);

  const navItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/', permission: 'DASHBOARD_VIEW' },
    { icon: Sparkles, label: t('nav.assistant'), path: '/assistant' },
    { icon: ShoppingCart, label: t('nav.pos'), path: '/pos', permission: 'POS_ACCESS' },
    { icon: Package, label: t('nav.catalog'), path: '/catalog', permission: 'CATALOG_VIEW' },
    { icon: CreditCard, label: t('nav.expenses'), path: '/expenses', permission: 'EXPENSES_VIEW' },
    { icon: ArrowRightLeft, label: t('nav.transfers'), path: '/transfers', permission: 'TRANSFERS_VIEW' },
    { icon: TicketIcon, label: t('nav.tickets'), path: '/tickets', permission: 'TICKETS_VIEW' },
    { icon: Users, label: t('nav.staff'), path: '/staff', permission: 'STAFF_MANAGE' },
    { icon: ShieldCheck, label: t('nav.audit'), path: '/audit', permission: 'AUDIT_VIEW' },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleBackup = () => {
    if (!hasPerm('BACKUP_RESET')) return;
    const dataStr = JSON.stringify({ catalog: catalogItems, timestamp: new Date().toISOString() }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `backup_alliance_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
  };

  const handleReset = () => {
    if (!hasPerm('BACKUP_RESET')) return;
    if (window.confirm('RESET ALL DATA?')) window.location.reload();
  };

  const currentNavLabel = navItems.find(i => i.path === location.pathname)?.label || 'Page';

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'blue-dark' ? 'bg-dark-bg' : 'bg-gray-50'}`}>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${theme === 'blue-dark' ? 'bg-dark-surface border-r border-gray-800 shadow-2xl' : 'bg-white border-r border-gray-200 shadow-xl'} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
          <h1 className={`text-xl font-bold italic tracking-tighter ${theme === 'blue-dark' ? 'text-dark-primary' : 'text-light-primary'}`}>ALLIANCE <span className="text-amber-500">DigiKiosk</span></h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"><X size={20}/></button>
        </div>
        <nav className="flex-1 overflow-y-auto pt-4 pb-4">
          {navItems.map((item) => (
            <SidebarItem 
                key={item.path} 
                icon={item.icon} 
                label={item.label} 
                path={item.path} 
                active={location.pathname === item.path} 
                onClick={() => handleNavClick(item.path)} 
                hidden={item.permission && !hasPerm(item.permission)}
            />
          ))}
          {hasPerm('BACKUP_RESET') && (
              <div className="mt-8">
                <div className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Maintenance</div>
                <SidebarItem icon={Save} label={t('nav.backup')} onClick={handleBackup} colorClass="text-emerald-500" />
                <SidebarItem icon={Trash2} label={t('nav.reset')} onClick={handleReset} colorClass="text-red-500" />
              </div>
          )}
        </nav>
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-black/20">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${theme === 'blue-dark' ? 'bg-dark-primary' : 'bg-light-primary'}`}>{user.full_name.charAt(0)}</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{user.full_name}</p>
              <p className="text-[10px] opacity-50 uppercase tracking-widest font-black">{user.role}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"><LogOut size={16} /> {t('nav.logout')}</button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-[#050c15]">
        <header className={`h-16 flex items-center justify-between px-6 border-b z-10 ${theme === 'blue-dark' ? 'bg-dark-bg/80 backdrop-blur-md border-gray-800' : 'bg-white/80 backdrop-blur-md border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800"><Menu size={24}/></button>
            <h2 className="text-sm font-black uppercase tracking-widest opacity-80">{currentNavLabel}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <button onClick={() => setLang('fr')} className={`px-4 py-1.5 text-[10px] font-black tracking-widest ${lang === 'fr' ? 'bg-blue-600 text-white' : 'opacity-40'}`}>FR</button>
              <button onClick={() => setLang('en')} className={`px-4 py-1.5 text-[10px] font-black tracking-widest ${lang === 'en' ? 'bg-blue-600 text-white' : 'opacity-40'}`}>EN</button>
            </div>
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 transition-all active:scale-90 shadow-sm">{theme === 'blue-dark' ? <Moon size={20} className="text-yellow-400"/> : <Sun size={20} className="text-amber-500"/>}</button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
};

const App = () => {
    const { staff } = useData();
    const [user, setUser] = useState<Staff | null>(null);
    const [pinEntry, setPinEntry] = useState('');
    const [error, setError] = useState('');
    const { t } = useI18n();
  
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const found = staff.find(s => s.pin_hash?.toLowerCase() === pinEntry.toLowerCase());
        if (found) {
            setUser(found);
            setError('');
            setPinEntry('');
        } else {
            setError('PIN incorrect (Format: ab-123456)');
        }
    }

    const LoginScreen = () => (
       <div className="h-screen flex flex-col items-center justify-center bg-[#071321] text-white p-4">
         <div className="mb-12 text-center">
            <h1 className="text-4xl font-black mb-2 tracking-tighter italic">ALLIANCE <span className="text-amber-500">DigiKiosk</span></h1>
            <p className="text-xs uppercase tracking-[0.5em] opacity-30">Point of Sale System</p>
         </div>
         <div className="p-10 bg-[#0B2238] rounded-[2.5rem] shadow-2xl flex flex-col gap-8 w-full max-w-sm border border-white/5 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-blue-500" />
           <div className="space-y-2">
                <h2 className="text-2xl font-black text-center">{t('common.login')}</h2>
                <p className="text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest opacity-60">Entrez vos identifiants</p>
           </div>
           
           <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">{t('staff.pin')}</label>
                    <div className="relative">
                        <Key className="absolute left-4 top-4.5 opacity-20" size={20} />
                        <input 
                            required 
                            type="text" 
                            placeholder="ex: sk-123456"
                            value={pinEntry}
                            onChange={e => setPinEntry(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#071321] border border-white/10 outline-none font-mono text-center tracking-widest text-lg focus:border-blue-500 transition-all"
                        />
                    </div>
                    {error && <p className="text-red-500 text-[10px] font-bold text-center mt-2">{error}</p>}
                </div>
                <button type="submit" className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-900/40 hover:bg-blue-500 active:scale-95 transition-all">
                    Débloquer
                </button>
           </form>

           <div className="pt-4 border-t border-white/5">
                <p className="text-[9px] text-center opacity-30 font-bold uppercase tracking-widest">Aide: Les initiales de votre nom suivies d'un tiret et de 6 chiffres.</p>
           </div>
         </div>
         
         <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-2 opacity-20">
            {staff.map(s => (
                <div key={s.id} className="text-[9px] font-mono cursor-default hover:opacity-100 transition-opacity flex justify-between gap-4" title={s.full_name}>
                    <span>{s.full_name.split(' ')[0]}</span> <span>{s.pin_hash}</span>
                </div>
            ))}
         </div>
       </div>
    );
  
    return (
      <HashRouter>
        <Routes>
          <Route path="/login" element={!user ? <LoginScreen /> : <Navigate to="/" />} />
          <Route path="/*" element={
              user ? (
                <Layout user={user} onLogout={() => setUser(null)}>
                   <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/assistant" element={<AiAssistant user={user} />} />
                      <Route path="/pos" element={<POSScreen currentUser={user} />} />
                      <Route path="/catalog" element={<CatalogScreen />} />
                      <Route path="/expenses" element={<ExpensesScreen />} />
                      <Route path="/transfers" element={<TransfersScreen />} />
                      <Route path="/tickets" element={<TicketsScreen />} />
                      <Route path="/staff" element={<StaffScreen />} />
                      <Route path="/audit" element={<AuditScreen />} />
                      <Route path="*" element={<Navigate to="/" />} />
                   </Routes>
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
          } />
        </Routes>
      </HashRouter>
    );
  };

export default App;
