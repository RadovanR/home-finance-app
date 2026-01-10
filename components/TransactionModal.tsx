import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Transaction, TransactionType, Category, AccountType, CategoryItem } from '../types';
import { ACCOUNT_TYPE_LABELS, MEAL_VOUCHER_VALUE } from '../constants';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  initialData?: Transaction | null;
  categories: CategoryItem[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSave, initialData, categories }) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [voucherCount, setVoucherCount] = useState('');
  const [category, setCategory] = useState<string>('');
  const [accountType, setAccountType] = useState<AccountType>('bank');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type);
        setAmount(initialData.amount.toString());
        setCategory(initialData.category);
        setAccountType(initialData.accountType);
        setDescription(initialData.description);
        setDate(initialData.date);
        setVoucherCount(''); // Reset unless we calculate it back, but usually simple amount is enough
      } else {
        // Reset defaults
        setType('expense');
        setAmount('');
        setVoucherCount('');
        // Set default category for expense
        const defaultCat = categories.find(c => c.type === 'expense');
        setCategory(defaultCat ? defaultCat.name : '');
        setAccountType('bank');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, initialData, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date,
      type,
      amount: parseFloat(amount),
      category: category,
      accountType,
      description
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
          <h2 className="text-xl font-bold text-gray-800">{initialData ? 'Upraviť transakciu' : 'Pridať transakciu'}</h2>
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
                const defaultCat = categories.find(c => c.type === 'income');
                setCategory(defaultCat ? defaultCat.name : '');
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
                const defaultCat = categories.find(c => c.type === 'expense');
                setCategory(defaultCat ? defaultCat.name : '');
              }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Výdavok
            </button>
            <button
              type="button"
              onClick={() => {
                setType('carryover');
                setCategory(Category.BALANCE);
              }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${type === 'carryover' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Zostatok
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dátum</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white min-w-0"
            />
          </div>


          {/* ... (previous code) ... */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategória</label>
            {type === 'carryover' ? (
              <input
                type="text"
                value={Category.BALANCE}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
              />
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="" disabled>Vyberte kategóriu</option>
                {categories
                  .filter(cat => cat.type === type)
                  .map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
              </select>
            )}
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
            {initialData ? 'Upraviť transakciu' : 'Uložiť transakciu'}
          </button>
        </form>
      </div>
    </div>
  );
};
