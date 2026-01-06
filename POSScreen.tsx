
import React, { useState, useRef, useMemo } from 'react';
import { useTheme, useI18n, useData } from './contexts';
import { CatalogItem, Sale, Staff } from './types';
import { Search, ShoppingCart, Trash2, ArrowRightLeft, Printer, CheckCircle, RefreshCw, Filter } from 'lucide-react';

interface POSProps {
    currentUser?: Staff | null;
}

const POSScreen: React.FC<POSProps> = ({ currentUser }) => {
  const { t } = useI18n();
  const { theme } = useTheme();
  const { catalogItems: items, adjustStock } = useData();
  const isDark = theme === 'blue-dark';

  // State
  const [cart, setCart] = useState<{item: CatalogItem, qty: number}[]>([]);
  const [search, setSearch] = useState('');
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Filters items based on staff assignment
  const displayedItems = useMemo(() => {
      let base = items;
      // If staff has limited assigned items, filter catalog
      if (currentUser && !currentUser.is_root && currentUser.assignedItemIds && currentUser.assignedItemIds.length > 0) {
          base = items.filter(i => currentUser.assignedItemIds?.includes(i.id));
      }
      return base.filter(i => 
          i.name.toLowerCase().includes(search.toLowerCase()) || 
          (i.sku && i.sku.toLowerCase().includes(search.toLowerCase()))
      );
  }, [items, search, currentUser]);

  const addToCart = (catalogItem: CatalogItem) => {
      if (catalogItem.track_stock && catalogItem.stock_qty <= 0) return;
      if (catalogItem.track_stock) adjustStock(catalogItem.id, -1);

      setCart(prev => {
          const existing = prev.find(line => line.item.id === catalogItem.id);
          if (existing) {
              return prev.map(line => line.item.id === catalogItem.id ? {...line, qty: line.qty + 1} : line);
          }
          return [...prev, {item: catalogItem, qty: 1}];
      });
  };

  const removeFromCart = (itemId: string, silent = false) => {
      const line = cart.find(l => l.item.id === itemId);
      if (!line) return;

      if (!silent) {
          const confirmed = window.confirm(t('pos.confirmRemove'));
          if (!confirmed) return;
      }

      if (line.item.track_stock) adjustStock(itemId, line.qty);
      setCart(prev => prev.filter(l => l.item.id !== itemId));
  };

  const updateQty = (itemId: string, delta: number) => {
      if (delta === 0) return;
      const line = cart.find(l => l.item.id === itemId);
      if (!line) return;
      const shelfItem = items.find(i => i.id === itemId);
      if (!shelfItem) return;

      if (delta > 0) {
           if (shelfItem.track_stock && shelfItem.stock_qty < delta) return; 
           if (shelfItem.track_stock) adjustStock(itemId, -delta);
      } else {
           if (line.qty + delta <= 0) {
               removeFromCart(itemId, false); // Mandatory confirm when hitting 0
               return;
           }
           if (shelfItem.track_stock) adjustStock(itemId, -delta);
      }
      setCart(prev => prev.map(l => l.item.id === itemId ? {...l, qty: l.qty + delta} : l));
  };

  const clearCart = () => {
    if (cart.length > 0 && window.confirm(t('common.confirmDelete'))) {
        cart.forEach(cartItem => {
            if (cartItem.item.track_stock) adjustStock(cartItem.item.id, cartItem.qty);
        });
        setCart([]);
    }
  };

  const handlePay = () => {
     if(cart.length > 0) {
        const saleId = `SALE-${Date.now().toString().slice(-6)}`;
        const totalAmount = total;
        
        const saleRecord: Sale = {
            id: Date.now().toString(),
            sale_no: saleId,
            total_amount: totalAmount,
            status: 'PAID',
            items: cart.map(c => ({ ...c.item, qty: c.qty, cartId: c.item.id })),
            created_at: new Date().toISOString()
        };

        setLastSale(saleRecord);
        setShowReceipt(true);
        setCart([]);
     }
  };

  const resetPOS = () => {
    setShowReceipt(false);
    setLastSale(null);
  };

  const printReceipt = () => {
    window.print();
  };

  const total = cart.reduce((acc, line) => acc + (line.item.price_amount * line.qty), 0);
  const cartItemCount = cart.reduce((a, b) => a + b.qty, 0);

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full overflow-hidden relative">
        <style>
          {`
            @media print {
              body * { visibility: hidden; }
              #printable-receipt, #printable-receipt * { visibility: visible; }
              #printable-receipt {
                position: absolute;
                left: 0;
                top: 0;
                width: 80mm;
                margin: 0;
                padding: 10px;
                font-family: 'Courier New', Courier, monospace;
              }
              .no-print { display: none !important; }
            }
          `}
        </style>

        {/* Product Grid */}
        <div className={`flex-1 flex flex-col gap-4 min-h-0 ${showReceipt ? 'blur-sm opacity-50' : ''}`}>
            <div className={`p-4 rounded-xl border flex items-center gap-3 shadow-sm shrink-0 ${isDark ? 'bg-dark-surface border-gray-700' : 'bg-white border-gray-200'}`}>
                <Search className={`opacity-50 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                <input 
                    placeholder={t('pos.search')} 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={`flex-1 bg-transparent outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                />
                {currentUser?.assignedItemIds && currentUser.assignedItemIds.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-bold border border-blue-500/20">
                        <Filter size={14} /> Assigned View
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
                    {displayedItems.map(item => {
                        const outOfStock = item.track_stock && item.stock_qty <= 0;
                        return (
                            <div 
                                key={item.id} 
                                onClick={() => !outOfStock && addToCart(item)}
                                className={`relative p-3 lg:p-4 rounded-xl border transition-all flex flex-col justify-between h-36 lg:h-40 shadow-sm overflow-hidden group
                                    ${isDark 
                                        ? 'bg-dark-surface border-gray-700 hover:border-gray-500' 
                                        : 'bg-white border-gray-200 hover:border-blue-400 shadow-sm hover:shadow-md'}
                                    ${outOfStock ? 'opacity-60 cursor-not-allowed grayscale bg-gray-100 dark:bg-gray-800' : 'cursor-pointer active:scale-95'}
                                `}
                            >
                                {outOfStock && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[1px]">
                                        <span className="bg-red-500/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform -rotate-6 border border-white/20">
                                            {t('pos.outOfStock')}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <h3 className={`font-bold text-sm lg:text-base line-clamp-2 mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.name}</h3>
                                    {item.sku && <p className="text-[10px] font-mono opacity-60 uppercase tracking-wider">{item.sku}</p>}
                                </div>
                                <div className="flex justify-between items-end mt-2">
                                    <div className="flex flex-col items-start">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide mb-1 ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                            {item.category}
                                        </span>
                                        {item.track_stock && <span className="text-xs font-medium">{t('pos.stock')}: {item.stock_qty}</span>}
                                    </div>
                                    <span className="font-bold text-base lg:text-lg">
                                        {item.price_amount.toLocaleString()} <span className="text-[10px] font-normal opacity-60">{t('pos.currency')}</span>
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {displayedItems.length === 0 && (
                        <div className="col-span-full py-20 text-center opacity-30">
                            No products matching criteria.
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Cart Sidebar */}
        <div className={`w-full lg:w-96 flex flex-col rounded-xl border shadow-lg shrink-0 h-[40vh] lg:h-full ${isDark ? 'bg-dark-surface border-gray-700' : 'bg-white border-gray-200'} ${showReceipt ? 'blur-sm opacity-50' : ''}`}>
             <div className={`p-4 lg:p-5 border-b font-bold text-lg flex justify-between items-center ${isDark ? 'border-gray-700 text-white' : 'border-gray-200 text-gray-900'}`}>
                 <span className="flex items-center gap-2"><ShoppingCart size={20}/> {t('pos.cart')}</span>
                 <span className={`text-xs font-bold px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {cartItemCount} {t('pos.itemsCount')}
                 </span>
             </div>
             
             <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3">
                 {cart.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center opacity-40 text-center p-4">
                         <ShoppingCart size={32} className="mb-4" />
                         <p className="font-medium">{t('pos.empty')}</p>
                     </div>
                 ) : (
                     cart.map(({item, qty}) => (
                         <div key={item.id} className={`flex justify-between items-center p-2 lg:p-3 rounded-xl border group transition-colors ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                             <div className="flex-1 min-w-0 pr-3">
                                 <div className="font-bold line-clamp-1 text-sm">{item.name}</div>
                                 <div className="text-xs opacity-50">{item.price_amount.toLocaleString()} {t('pos.currency')}</div>
                             </div>
                             <div className="flex items-center gap-1">
                                 <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700">-</button>
                                 <span className="w-6 text-center font-bold">{qty}</span>
                                 <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700">+</button>
                             </div>
                             <button onClick={() => removeFromCart(item.id)} className="ml-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all active:scale-90">
                                <Trash2 size={16}/>
                             </button>
                         </div>
                     ))
                 )}
             </div>
             
             <div className={`p-4 lg:p-5 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                 <div className="flex justify-between items-end mb-4">
                     <span className="text-sm opacity-60">{t('pos.total')}</span>
                     <span className="text-2xl lg:text-3xl font-bold">{total.toLocaleString()} {t('pos.currency')}</span>
                 </div>
                 <div className="grid grid-cols-3 gap-3">
                     <button onClick={clearCart} className={`py-3 rounded-xl font-bold border transition-colors active:scale-95 ${isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
                         <Trash2 size={18} className="mx-auto" />
                     </button>
                     <button 
                        onClick={handlePay}
                        disabled={cart.length === 0}
                        className={`col-span-2 py-3 rounded-xl font-bold text-white shadow-lg active:scale-95 flex items-center justify-center gap-2 ${isDark ? 'bg-dark-primary' : 'bg-light-primary'} disabled:opacity-50`}
                     >
                         {t('pos.pay')} <ArrowRightLeft size={18} />
                     </button>
                 </div>
             </div>
        </div>

        {/* Receipt Modal Overlay */}
        {showReceipt && lastSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
              <div className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-dark-surface' : 'bg-white'}`}>
                  <div className="p-6 text-center border-b border-dashed border-gray-300 dark:border-gray-700">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-500 mb-4 animate-bounce">
                          <CheckCircle size={40} />
                      </div>
                      <h2 className="text-xl font-black">{t('pos.paySuccess').split('!')[0]}</h2>
                      <p className="text-sm opacity-60">{lastSale.sale_no}</p>
                  </div>

                  <div id="printable-receipt" className={`p-6 bg-white text-black text-sm overflow-y-auto max-h-[50vh] flex flex-col items-center ${isDark ? 'dark:bg-white dark:text-black' : ''}`}>
                      <div className="w-full text-center mb-4">
                          <div className="font-black text-xl tracking-tighter italic">ALLIANCE DIGIKIOSK</div>
                          <div className="text-[10px] uppercase opacity-80 mt-1">Lomé, Togo • +228 00 00 00 00</div>
                          <div className="border-b border-black border-dashed my-2"></div>
                          <div className="font-bold text-xs">{t('pos.receipt.title')}</div>
                      </div>

                      <div className="w-full flex justify-between text-[10px] mb-4 font-mono">
                          <span>{t('pos.receipt.date')}: {new Date(lastSale.created_at).toLocaleString()}</span>
                          <span>{lastSale.sale_no}</span>
                      </div>

                      <div className="w-full font-mono text-[11px] mb-4">
                          <div className="flex justify-between border-b border-black pb-1 mb-1 font-bold">
                              <span className="w-1/2">{t('pos.receipt.item')}</span>
                              <span className="w-1/6 text-right">{t('pos.receipt.qty')}</span>
                              <span className="w-1/3 text-right">{t('pos.receipt.subtotal')}</span>
                          </div>
                          {lastSale.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between py-0.5">
                                  <span className="w-1/2 line-clamp-1">{item.name}</span>
                                  <span className="w-1/6 text-right">{item.qty}</span>
                                  <span className="w-1/3 text-right">{(item.price_amount * item.qty).toLocaleString()}</span>
                              </div>
                          ))}
                      </div>

                      <div className="w-full border-t border-black border-dashed pt-2 flex justify-between font-black text-lg">
                          <span>{t('pos.receipt.total')}</span>
                          <span>{lastSale.total_amount.toLocaleString()} XOF</span>
                      </div>

                      <div className="w-full text-center mt-6 italic text-[10px]">
                          {t('pos.receipt.thankYou')}
                      </div>
                  </div>

                  <div className="p-6 grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800">
                      <button 
                        onClick={printReceipt}
                        className={`py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                      >
                          <Printer size={18} /> {t('pos.receipt.print')}
                      </button>
                      <button 
                        onClick={resetPOS}
                        className={`py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-white transition-all active:scale-95 shadow-lg ${isDark ? 'bg-dark-primary shadow-green-900/40' : 'bg-light-primary shadow-green-900/20'}`}
                      >
                          <RefreshCw size={18} /> {t('pos.receipt.newSale')}
                      </button>
                  </div>
              </div>
          </div>
        )}
    </div>
  );
};

export default POSScreen;
