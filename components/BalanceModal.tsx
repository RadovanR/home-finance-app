import React from 'react';
import { X, CreditCard, Banknote, Ticket } from 'lucide-react';
import { AccountType } from '../types';
import { ACCOUNT_TYPE_LABELS, MEAL_VOUCHER_VALUE } from '../constants';

interface BalanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    balances: Record<AccountType, number>;
    title?: string;
    totalLabel?: string;
}

export const BalanceModal: React.FC<BalanceModalProps> = ({
    isOpen,
    onClose,
    balances,
    title = 'Detail Zostatkov',
    totalLabel = 'Celkový dostupný zostatok'
}) => {
    if (!isOpen) return null;

    const total = (Object.values(balances) as number[]).reduce((a, b) => a + b, 0);

    const getIcon = (type: AccountType) => {
        switch (type) {
            case 'bank': return <CreditCard className="text-indigo-600" size={24} />;
            case 'cash': return <Banknote className="text-emerald-600" size={24} />;
            case 'meal_voucher': return <Ticket className="text-orange-600" size={24} />;
        }
    };

    const getColor = (type: AccountType) => {
        switch (type) {
            case 'bank': return 'bg-indigo-50 text-indigo-700';
            case 'cash': return 'bg-emerald-50 text-emerald-700';
            case 'meal_voucher': return 'bg-orange-50 text-orange-700';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="text-center mb-6">
                        <p className="text-sm text-gray-500 mb-1">{totalLabel}</p>
                        <p className="text-3xl font-bold text-gray-900">{total.toFixed(2)} €</p>
                    </div>

                    <div className="space-y-3">
                        {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((type) => {
                            const amount = balances[type];
                            const count = type === 'meal_voucher' ? Math.round(amount / MEAL_VOUCHER_VALUE) : 0;

                            return (
                                <div key={type} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg ${getColor(type).split(' ')[0]}`}>
                                            {getIcon(type)}
                                        </div>
                                        <span className="font-medium text-gray-700">{ACCOUNT_TYPE_LABELS[type]}</span>
                                    </div>
                                    <div className="text-right">
                                        {type === 'meal_voucher' ? (
                                            <>
                                                <span className="font-bold text-gray-900 block">
                                                    {count} ks
                                                </span>
                                                <span className="text-xs text-gray-500 font-medium">
                                                    ({amount.toFixed(2)} €)
                                                </span>
                                            </>
                                        ) : (
                                            <span className="font-bold text-gray-900 block">
                                                {amount.toFixed(2)} €
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
