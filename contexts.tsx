
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18N, MOCK_CATALOG, MOCK_STAFF, DEFAULT_ROLE_PERMISSIONS } from './constants';
import { CatalogItem, Staff, RoleDefinition } from './types';

// --- Theme Context ---
type Theme = 'light' | 'blue-dark';
interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}
const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children?: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  useEffect(() => {
    const saved = localStorage.getItem('app-theme') as Theme;
    if (saved) setThemeState(saved);
  }, []);
  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('app-theme', t);
  };
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'blue-dark' : 'light';
    setTheme(newTheme);
  };
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <div className={theme === 'blue-dark' ? 'dark' : ''}>
        <div className="min-h-screen bg-light-bg text-light-text transition-colors duration-300 dark:bg-dark-bg dark:text-dark-text">
          {children}
        </div>
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

// --- I18n Context ---
type Lang = 'fr' | 'en';
interface I18nContextProps {
  lang: Lang;
  t: (key: string) => string;
  setLang: (l: Lang) => void;
}
const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export const I18nProvider = ({ children }: { children?: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>('fr');
  useEffect(() => {
    const saved = localStorage.getItem('app-lang') as Lang;
    if (saved) setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('app-lang', l);
  };
  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = I18N[lang];
    for (const key of keys) {
      if (current[key] === undefined) return path;
      current = current[key];
    }
    return current as string;
  };
  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
};

// --- Data Context ---
interface DataContextProps {
  catalogItems: CatalogItem[];
  staff: Staff[];
  roles: RoleDefinition[];
  updateCatalogItem: (item: CatalogItem) => void;
  deleteCatalogItem: (id: string) => void;
  setCatalogItems: (items: CatalogItem[]) => void;
  adjustStock: (itemId: string, delta: number) => void;
  updateStaff: (member: Staff) => void;
  deleteStaff: (id: string) => void;
  addRole: (role: RoleDefinition) => void;
  deleteRole: (id: string) => void;
  syncWithBackend: () => Promise<void>;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export const DataProvider = ({ children }: { children?: ReactNode }) => {
  const [catalogItems, setCatalogItemsState] = useState<CatalogItem[]>(MOCK_CATALOG);
  const [staff, setStaff] = useState<Staff[]>(MOCK_STAFF);
  const [roles, setRoles] = useState<RoleDefinition[]>([
    { id: '1', name: 'ROOT', permissions: DEFAULT_ROLE_PERMISSIONS['ROOT'] },
    { id: '2', name: 'MANAGER', permissions: DEFAULT_ROLE_PERMISSIONS['MANAGER'] },
    { id: '3', name: 'CASHIER', permissions: DEFAULT_ROLE_PERMISSIONS['CASHIER'] },
    { id: '4', name: 'OPERATRICE DE SAISIE', permissions: DEFAULT_ROLE_PERMISSIONS['OPERATRICE DE SAISIE'] },
    { id: '5', name: 'COMMERCIAL', permissions: DEFAULT_ROLE_PERMISSIONS['COMMERCIAL'] },
    { id: '6', name: 'TECHNICIEN', permissions: DEFAULT_ROLE_PERMISSIONS['TECHNICIEN'] }
  ]);

  const syncWithBackend = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/catalog', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCatalogItemsState(data);
      }
    } catch (err) {
      console.warn('API Sync failed, using local/mock state');
    }
  };

  useEffect(() => {
    syncWithBackend();
  }, []);

  const updateCatalogItem = (updatedItem: CatalogItem) => {
    setCatalogItemsState(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const deleteCatalogItem = (id: string) => {
    setCatalogItemsState(prev => prev.filter(item => item.id !== id));
  };

  const setCatalogItems = (items: CatalogItem[]) => {
      setCatalogItemsState(items);
  };

  const adjustStock = (itemId: string, delta: number) => {
    setCatalogItemsState(prev => prev.map(item => {
      if (item.id === itemId && item.track_stock) {
        return { ...item, stock_qty: item.stock_qty + delta };
      }
      return item;
    }));
  };

  const updateStaff = (member: Staff) => {
    setStaff(prev => {
        const exists = prev.find(s => s.id === member.id);
        if (exists) return prev.map(s => s.id === member.id ? member : s);
        return [...prev, member];
    });
  };

  const deleteStaff = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  const addRole = (role: RoleDefinition) => {
    setRoles(prev => [...prev, role]);
  };

  const deleteRole = (id: string) => {
    setRoles(prev => prev.filter(r => r.id !== id));
  };

  return (
    <DataContext.Provider value={{ 
        catalogItems, updateCatalogItem, deleteCatalogItem, setCatalogItems, adjustStock,
        staff, updateStaff, deleteStaff, roles, addRole, deleteRole, syncWithBackend
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
