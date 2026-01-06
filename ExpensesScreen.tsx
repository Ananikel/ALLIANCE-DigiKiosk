
import React, { useState } from 'react';
import { useTheme, useI18n } from './contexts';
import { Expense } from './types';
import { MOCK_EXPENSES, MOCK_EXPENSE_CATEGORIES } from './constants';
import { Plus, X, Calendar, Tag, FileText, DollarSign, CreditCard, Edit, Trash2 } from 'lucide-react';

const ExpensesScreen = () => {
  const { t } = useI18n();
  const { theme } = useTheme();
  const isDark = theme === 'blue-dark';

  // State
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Form State
  const initialFormState = {
    date: new Date().toISOString().split('T')[0],
    category: MOCK_EXPENSE_CATEGORIES[0],
    description: '',
    amount: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  const openModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        date: expense.date,
        category: expense.category,
        description: expense.description,
        amount: expense.amount.toString()
      });
    } else {
      setEditingExpense(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    const expenseData: Expense = {
      id: editingExpense ? editingExpense.id : Date.now().toString(),
      date: formData.date,
      category: formData.category,
      description: formData.description,
      amount: Number(formData.amount),
      user: editingExpense ? editingExpense.user : 'Current User' // In real app, get from context
    };

    if (editingExpense) {
      setExpenses(prev => prev.map(exp => exp.id === expenseData.id ? expenseData : exp));
    } else {
      setExpenses([expenseData, ...expenses]);
    }

    setFormData(initialFormState);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('common.confirmDelete'))) {
      setExpenses(prev => prev.filter(exp => exp.id !== id));
    }
  };

  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
           <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('expenses.title')}</h1>
           <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
             {t('expenses.totalExpenses')}: <span className="font-bold text-red-500">{totalExpenses.toLocaleString()} XOF</span>
           </p>
        </div>
        <button
          onClick={() => openModal()}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-white transition-transform active:scale-95 shadow-lg
            ${isDark ? 'bg-dark-primary hover:bg-opacity-90' : 'bg-light-primary hover:bg-opacity-90'}
          `}
        >
          <Plus size={20} />
          {t('expenses.addExpense')}
        </button>
      </div>

      {/* List */}
      <div className={`flex-1 rounded-xl border overflow-hidden shadow-sm flex flex-col ${isDark ? 'border-gray-700 bg-dark-surface' : 'border-gray-200 bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={isDark ? 'bg-gray-800/50 text-gray-200' : 'bg-gray-50 text-gray-700'}>
              <tr>
                <th className="p-4 font-semibold">{t('expenses.date')}</th>
                <th className="p-4 font-semibold">{t('expenses.category')}</th>
                <th className="p-4 font-semibold">{t('expenses.description')}</th>
                <th className="p-4 font-semibold text-right">{t('expenses.amount')}</th>
                <th className="p-4 font-semibold text-center">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className={isDark ? 'divide-y divide-gray-800 text-gray-300' : 'divide-y divide-gray-100 text-gray-700'}>
              {expenses.map((item) => (
                <tr key={item.id} className={`transition-colors ${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}`}>
                  <td className="p-4 font-mono text-sm opacity-80">{item.date}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="p-4 font-medium">{item.description}</td>
                  <td className="p-4 text-right font-bold text-red-500">
                    -{item.amount.toLocaleString()} <span className="text-xs text-gray-500 font-normal">XOF</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => openModal(item)}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-gray-100 text-blue-600'}`}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                 <tr>
                    <td colSpan={5} className="p-8 text-center opacity-50">
                        No expenses recorded yet.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden
             ${isDark ? 'bg-dark-surface text-white' : 'bg-white text-gray-900'}
          `}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                  <CreditCard className="text-red-500" size={24} />
                  {editingExpense ? t('expenses.category') : t('expenses.formTitle')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="opacity-70 hover:opacity-100 transition-opacity">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">{t('expenses.date')}</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 opacity-50" size={16} />
                    <input 
                        type="date"
                        required
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        className={`w-full pl-10 pr-3 py-3 rounded-xl border outline-none
                            ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}
                        `}
                    />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">{t('expenses.category')}</label>
                <div className="relative">
                    <Tag className="absolute left-3 top-3.5 opacity-50" size={16} />
                    <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className={`w-full pl-10 pr-3 py-3 rounded-xl border outline-none appearance-none
                            ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}
                        `}
                    >
                        {MOCK_EXPENSE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">{t('expenses.description')}</label>
                <div className="relative">
                    <FileText className="absolute left-3 top-3.5 opacity-50" size={16} />
                    <input 
                        type="text"
                        required
                        placeholder={t('expenses.enterDescription')}
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className={`w-full pl-10 pr-3 py-3 rounded-xl border outline-none
                            ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}
                        `}
                    />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-1 opacity-80">{t('expenses.amount')}</label>
                <div className="relative">
                    <div className="absolute left-3 top-3.5 opacity-50 font-bold">XOF</div>
                    <input 
                        type="number"
                        required
                        min="0"
                        step="50"
                        placeholder="0"
                        value={formData.amount}
                        onChange={e => setFormData({...formData, amount: e.target.value})}
                        className={`w-full pl-12 pr-3 py-3 rounded-xl border outline-none font-bold text-lg
                            ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}
                        `}
                    />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors
                    ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}
                  `}
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit"
                  className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95
                    ${isDark ? 'bg-dark-primary hover:bg-opacity-90' : 'bg-light-primary hover:bg-opacity-90'}
                  `}
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesScreen;
