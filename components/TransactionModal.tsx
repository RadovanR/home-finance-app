import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Transaction, TransactionType, Category, AccountType } from '../types';
import { ACCOUNT_TYPE_LABELS, MEAL_VOUCHER_VALUE } from '../constants';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSave }) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [voucherCount, setVoucherCount] = useState('');
  const [category, setCategory] = useState<string>(Category.FOOD);
  const [accountType, setAccountType] = useState<AccountType>('bank');
  const [description, setDescription] = useState('');
  const [person, setPerson] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date,
      type,
      amount: parseFloat(amount),
      category: type === 'income' ? Category.SALARY : category,
      accountType,
      description,
      person: person || 'Rodina'
    });
    // Reset and close
    setAmount('');
    setVoucherCount('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Pridať transakciu</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Type Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory(Category.SALARY);
              }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Príjem
            </button>
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory(Category.FOOD);
              }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Výdavok
            </button>
          </div>


          {/* ... Type Toggle ... */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Typ účtu</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {accountType === 'meal_voucher' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Počet lístkov (1 ks = {MEAL_VOUCHER_VALUE.toFixed(2)}€)</label>
              <div className="flex gap-4">
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={voucherCount}
                  onChange={(e) => {
                    setVoucherCount(e.target.value);
                    const count = parseFloat(e.target.value);
                    if (!isNaN(count)) {
                      setAmount((count * MEAL_VOUCHER_VALUE).toFixed(2));
                    } else {
                      setAmount('');
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="0"
                />
                <div className="flex items-center justify-center bg-gray-50 px-4 rounded-lg border border-gray-200 min-w-[100px]">
                  <span className="font-bold text-gray-700">{amount ? `${amount} €` : '0.00 €'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Suma (€)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="0.00"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dátum</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Osoba</label>
              <input
                type="text"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                placeholder="Napr. Peter"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>


          {/* ... (previous code) ... */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategória</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {Object.values(Category)
                .filter(cat => {
                  if (type === 'income') {
                    return [Category.SALARY, Category.GIFTS, Category.OTHER].includes(cat);
                  } else {
                    return cat !== Category.SALARY;
                  }
                })
                .map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Popis</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Napr. Nákup v Tesco"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors mt-2"
          >
            Uložiť transakciu
          </button>
        </form>
      </div>
    </div>
  );
};
