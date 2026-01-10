import React from 'react';
import { X, Pencil, Trash2, Calendar, Tag, CreditCard, AlignLeft } from 'lucide-react';
import { Transaction, AccountType, CategoryItem } from '../types';
import { ACCOUNT_TYPE_LABELS, CATEGORY_COLORS } from '../constants';
import { format, parseISO } from 'date-fns';
import { sk } from 'date-fns/locale';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  categories: CategoryItem[];
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onEdit,
  onDelete,
  categories
}) => {
  if (!isOpen || !transaction) return null;

  const categoryColor = categories.find(c => c.name === transaction.category)?.color || CATEGORY_COLORS[transaction.category] || '#ccc';

  const handleDelete = () => {
    if (window.confirm('Naozaj chcete vymazať túto transakciu?')) {
      onDelete(transaction.id);
      onClose();
    }
  };

  const handleEdit = () => {
    onEdit(transaction);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Detail transakcie</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount Section */}
          <div className="text-center">
            <span className={`text-4xl font-bold block mb-1 ${transaction.type === 'income' ? 'text-emerald-600' :
                transaction.type === 'carryover' ? 'text-indigo-600' : 'text-rose-600'
              }`}>
              {transaction.type === 'income' || transaction.type === 'carryover' ? '+' : '-'}{transaction.amount.toFixed(2)} €
            </span>
            <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">
              {transaction.type === 'income' ? 'Príjem' : transaction.type === 'carryover' ? 'Zostatok z minula' : 'Výdavok'}
            </span>
          </div>

          <div className="space-y-4">
            {/* Description */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="text-gray-400 mt-0.5">
                <AlignLeft size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-0.5">Popis</p>
                <p className="font-medium text-gray-900 text-lg leading-snug">
                  {transaction.description || 'Bez popisu'}
                </p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="text-gray-400">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-0.5">Dátum</p>
                <p className="font-medium text-gray-900">
                  {format(parseISO(transaction.date), 'd. MMMM yyyy', { locale: sk })}
                </p>
              </div>
            </div>

            {/* Category */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: categoryColor }}
              >
                {transaction.category.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-0.5">Kategória</p>
                <p className="font-medium text-gray-900">{transaction.category}</p>
              </div>
            </div>

            {/* Account */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="text-gray-400">
                <CreditCard size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-0.5">Účet</p>
                <p className="font-medium text-gray-900">
                  {ACCOUNT_TYPE_LABELS[transaction.accountType || 'bank']}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 grid grid-cols-2 gap-3 bg-gray-50">
          <button
            onClick={handleEdit}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:text-indigo-600 transition-colors shadow-sm"
          >
            <Pencil size={18} />
            Upraviť
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-rose-100 text-rose-600 font-semibold rounded-xl hover:bg-rose-50 transition-colors shadow-sm"
          >
            <Trash2 size={18} />
            Vymazať
          </button>
        </div>
      </div>
    </div>
  );
};
