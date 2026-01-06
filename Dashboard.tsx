
import React from 'react';
import { useTheme, useI18n, useData } from './contexts';
import { BarChart3, TrendingUp, Package, AlertTriangle, ReceiptText } from 'lucide-react';

const Dashboard = () => {
  const { t } = useI18n();
  const { theme: appTheme } = useTheme();
  const { catalogItems } = useData();
  const isDark = appTheme === 'blue-dark';

  const lowStockItems = catalogItems.filter(item => item.track_stock && item.stock_qty <= 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`p-6 rounded-3xl border shadow-sm flex items-center gap-5 ${isDark ? 'bg-dark-surface border-gray-700' : 'bg-white border-gray-200'}`}>
           <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500">
             <TrendingUp size={32} />
           </div>
           <div>
             <h3 className="text-xs font-black uppercase tracking-widest opacity-40">{t('dashboard.salesToday')}</h3>
             <p className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>125,000 FCFA</p>
           </div>
        </div>
        <div className={`p-6 rounded-3xl border shadow-sm flex items-center gap-5 ${isDark ? 'bg-dark-surface border-gray-700' : 'bg-white border-gray-200'}`}>
           <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500">
             <BarChart3 size={32} />
           </div>
           <div>
             <h3 className="text-xs font-black uppercase tracking-widest opacity-40">{t('dashboard.transactions')}</h3>
             <p className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>12</p>
           </div>
        </div>
        <div className={`p-6 rounded-3xl border shadow-sm flex items-center gap-5 ${isDark ? 'bg-dark-surface border-gray-700' : 'bg-white border-gray-200'}`}>
           <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-500">
             <AlertTriangle size={32} />
           </div>
           <div>
             <h3 className="text-xs font-black uppercase tracking-widest opacity-40">{t('dashboard.openTickets')}</h3>
             <p className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>3</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Low Stock Overview */}
          <div className={`p-6 rounded-3xl border shadow-sm ${isDark ? 'bg-dark-surface border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <Package className="text-orange-500" size={20} />
                    {t('dashboard.lowStock')}
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-1 bg-red-500/10 text-red-500 rounded-lg">{lowStockItems.length} items</span>
              </div>
              <div className="space-y-3">
                {lowStockItems.length > 0 ? lowStockItems.map(item => (
                    <div key={item.id} className={`flex items-center justify-between p-3 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                        <span className="font-bold text-sm">{item.name}</span>
                        <span className="font-black text-red-500 text-xs">{item.stock_qty} pcs left</span>
                    </div>
                )) : (
                    <div className="py-10 text-center opacity-30 text-sm font-medium">Stock levels are healthy.</div>
                )}
              </div>
          </div>

          {/* Activity Placeholder */}
          <div className={`p-6 rounded-3xl border shadow-sm ${isDark ? 'bg-dark-surface border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 mb-6">
                  <ReceiptText className="text-blue-500" size={20} />
                  {t('dashboard.recentSales')}
              </h3>
              <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                      <div key={i} className={`flex items-center gap-4 p-3 rounded-2xl border-l-4 border-emerald-500 ${isDark ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
                          <div className="flex-1">
                              <div className="font-bold text-sm italic">SALE-00{i+100}</div>
                              <div className="text-[10px] opacity-40 uppercase font-black">10:3{i} AM</div>
                          </div>
                          <div className="font-black text-emerald-500 text-sm">+{(5000 * i).toLocaleString()} XOF</div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
