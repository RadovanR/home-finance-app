import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAmount: number;
  onSave: (amount: number) => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({ isOpen, onClose, currentAmount, onSave }) => {
  const [amount, setAmount] = useState(currentAmount.toString());

  useEffect(() => {
    setAmount(currentAmount.toString());
  }, [currentAmount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) {
      onSave(val);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Nastaviť rozpočet</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Mesačný limit (€)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg font-semibold"
              placeholder="0.00"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Uložiť rozpočet
          </button>
        </form>
      </div>
    </div>
  );
};