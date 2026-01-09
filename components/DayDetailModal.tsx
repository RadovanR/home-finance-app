import React from 'react';
import { X, TrendingUp, TrendingDown, Calendar, CreditCard, Banknote, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { Transaction, AccountType } from '../types';
import { CATEGORY_COLORS, ACCOUNT_TYPE_LABELS } from '../constants';

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  transactions: Transaction[];
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({ isOpen, onClose, date, transactions }) => {
  if (!isOpen || !date) return null;

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'bank': return <CreditCard size={12} className="text-indigo-500" />;
      case 'cash': return <Banknote size={12} className="text-emerald-500" />;
      case 'meal_voucher': return <Ticket size={12} className="text-orange-500" />;
      default: return <CreditCard size={12} className="text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Calendar size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">{format(date, 'EEEE', { locale: sk })}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 capitalize">{format(date, 'd. MMMM yyyy', { locale: sk })}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Daily Summary */}
        <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
          <div className="p-4 flex flex-col items-center justify-center bg-emerald-50/30">
            <div className="flex items-center gap-1 text-emerald-600 mb-1">
              <TrendingUp size={14} />
              <span className="text-xs font-semibold uppercase">Príjmy</span>
            </div>
            <p className="text-xl font-bold text-emerald-700">+{totalIncome.toFixed(2)} €</p>
          </div>
          <div className="p-4 flex flex-col items-center justify-center bg-rose-50/30">
            <div className="flex items-center gap-1 text-rose-600 mb-1">
              <TrendingDown size={14} />
              <span className="text-xs font-semibold uppercase">Výdavky</span>
            </div>
            <p className="text-xl font-bold text-rose-700">-{totalExpense.toFixed(2)} €</p>
          </div>
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center">
              <div className="bg-gray-100 p-4 rounded-full mb-3">
                <Calendar size={32} className="opacity-50" />
              </div>
              <p>Žiadne transakcie v tento deň.</p>
            </div>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="group bg-white flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-md transition-all hover:border-indigo-100">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm transform group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: CATEGORY_COLORS[tx.category] || '#ccc' }}
                  >
                    {tx.category.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {tx.category}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        {getAccountIcon(tx.accountType || 'bank')}
                        <span>{ACCOUNT_TYPE_LABELS[tx.accountType || 'bank']}</span>
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{tx.person}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-lg font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)} €
                </span>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
          >
            Zavrieť
          </button>
        </div>
      </div>
    </div>
  );
};
