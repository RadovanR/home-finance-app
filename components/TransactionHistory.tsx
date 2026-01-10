
import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { sk } from 'date-fns/locale';
import {
    ArrowUpDown,
    Filter,
    ChevronRight,
    Search,
    ChevronDown,
    ChevronUp,
    X,
    Calendar,
    Wallet,
    Tag,
    CreditCard
} from 'lucide-react';
import { Transaction, CategoryItem } from '../types';
import { CATEGORY_COLORS, ACCOUNT_TYPE_LABELS } from '../constants';

interface TransactionHistoryProps {
    transactions: Transaction[];
    categories: CategoryItem[];
    onTransactionClick: (tx: Transaction) => void;
}

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
    transactions,
    categories,
    onTransactionClick
}) => {
    const [sortOption, setSortOption] = useState<SortOption>('date-desc');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isFilterClosing, setIsFilterClosing] = useState(false);

    // Filters state
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedAccountType, setSelectedAccountType] = useState<string>('');

    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const getAccountIcon = (type: string) => <CreditCard size={14} />;

    // Sorting and Filtering Logic
    const processedTransactions = useMemo(() => {
        let result = [...transactions];

        // 1. Filter
        if (selectedType) {
            result = result.filter(t => t.type === selectedType);
        }
        if (selectedCategory) {
            result = result.filter(t => t.category === selectedCategory);
        }
        if (selectedAccountType) {
            result = result.filter(t => t.accountType === selectedAccountType);
        }

        if (dateFrom) {
            result = result.filter(t => t.date >= dateFrom);
        }
        if (dateTo) {
            result = result.filter(t => t.date <= dateTo);
        }

        // 2. Sort
        switch (sortOption) {
            case 'date-asc':
                result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                break;
            case 'date-desc':
                result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                break;
            case 'amount-asc':
                result.sort((a, b) => a.amount - b.amount);
                break;
            case 'amount-desc':
                result.sort((a, b) => b.amount - a.amount);
                break;
        }

        return result;
    }, [transactions, sortOption, selectedType, selectedCategory, selectedAccountType, dateFrom, dateTo]);

    const clearFilters = () => {
        setSelectedType('');
        setSelectedCategory('');
        setSelectedAccountType('');

        setDateFrom('');
        setDateTo('');
    };

    const handleToggleFilter = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        if (isFilterOpen) {
            setIsFilterClosing(true);
            setTimeout(() => {
                setIsFilterOpen(false);
                setIsFilterClosing(false);
            }, 300);
        } else {
            setIsFilterOpen(true);
        }
    };

    const hasActiveFilters = selectedType || selectedCategory || selectedAccountType || dateFrom || dateTo;

    return (
        <div className="space-y-4">
            {/* Controls Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center transition-all">

                {/* Sort Selector */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <ArrowUpDown size={18} className="text-gray-400" />
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as SortOption)}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 outline-none"
                    >
                        <option value="date-desc">Najnovšie (Dátum zostup.)</option>
                        <option value="date-asc">Najstaršie (Dátum vzostup.)</option>
                        <option value="amount-desc">Najvyššia suma</option>
                        <option value="amount-asc">Najnižšia suma</option>
                    </select>
                </div>

                {/* Filter Toggle */}
                <button
                    type="button"
                    onClick={handleToggleFilter}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto justify-center ${isFilterOpen || hasActiveFilters
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <Filter size={18} />
                    Filtrovať
                    {hasActiveFilters && (
                        <span className="ml-1 bg-indigo-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                            {[selectedType, selectedCategory, selectedAccountType, dateFrom || dateTo].filter(Boolean).length}
                        </span>
                    )}
                    {isFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {/* Filter Panel */}
            {(isFilterOpen || isFilterClosing) && (
                <div className={`${isFilterClosing ? 'animate-collapse' : 'animate-expand'}`}>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-0">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Filter size={18} className="text-indigo-600" />
                                Filtre
                            </h3>
                            <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-rose-600 flex items-center gap-1 transition-colors">
                                <X size={14} /> Vymazať filtre
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Transaction Type Filter */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
                                    <ArrowUpDown size={12} /> Typ transakcie
                                </label>
                                <select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                                >
                                    <option value="">Všetky typy</option>
                                    <option value="income">Príjem</option>
                                    <option value="expense">Výdavok</option>
                                    <option value="carryover">Zostatok z minula</option>
                                </select>
                            </div>

                            {/* Category Filter */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
                                    <Tag size={12} /> Kategória
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                                >
                                    <option value="">Všetky kategórie</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Account Type Filter */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
                                    <Wallet size={12} /> Typ účtu
                                </label>
                                <select
                                    value={selectedAccountType}
                                    onChange={(e) => setSelectedAccountType(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                                >
                                    <option value="">Všetky účty</option>
                                    {Object.entries(ACCOUNT_TYPE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>



                            {/* Date Range */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
                                    <Calendar size={12} /> Dátum
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                                    />
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {processedTransactions.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="bg-gray-100 p-4 rounded-full mb-3 text-gray-400">
                            <Search size={24} />
                        </div>
                        <p className="text-gray-500 font-medium">Žiadne transakcie nevyhovujú filtrom.</p>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="text-indigo-600 hover:underline mt-2 text-sm">
                                Zrušiť filtre
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Mobile List */}
                        <div className="block md:hidden divide-y divide-gray-100">
                            {processedTransactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    onClick={() => onTransactionClick(tx)}
                                    className="p-4 flex flex-col gap-3 cursor-pointer active:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center space-x-3 overflow-hidden">
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                                                style={{ backgroundColor: categories.find(c => c.name === tx.category)?.color || CATEGORY_COLORS[tx.category] || '#ccc' }}
                                            >
                                                {tx.category.charAt(0)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-gray-900 truncate">{tx.description}</p>
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <span className="truncate">{format(parseISO(tx.date), 'd.M.')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <span className={`font-bold block text-lg ${tx.type === 'income' ? 'text-emerald-600' :
                                                tx.type === 'carryover' ? 'text-indigo-600' : 'text-rose-600'
                                                }`}>
                                                {tx.type === 'income' || tx.type === 'carryover' ? '+' : '-'}{tx.amount.toFixed(2)} €
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded-lg gap-2">
                                        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                                            <span className="truncate max-w-[80px] sm:max-w-none" title={tx.category}>{tx.category}</span>
                                            <span className="flex-shrink-0">•</span>
                                            <span className="flex items-center gap-1 truncate">
                                                <span className="truncate">{ACCOUNT_TYPE_LABELS[tx.accountType || 'bank']}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                                        <th className="p-4 font-semibold">Dátum</th>
                                        <th className="p-4 font-semibold">Kategória</th>
                                        <th className="p-4 font-semibold">Účet</th>
                                        <th className="p-4 font-semibold">Popis</th>
                                        <th className="p-4 font-semibold text-right">Suma</th>
                                        <th className="p-4 font-semibold text-center">Akcia</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {processedTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50">
                                            <td className="p-4 text-sm text-gray-600">{format(parseISO(tx.date), 'd.M.yyyy')}</td>
                                            <td className="p-4">
                                                <span
                                                    className="px-2 py-1 rounded-full text-xs font-medium text-white"
                                                    style={{ backgroundColor: categories.find(c => c.name === tx.category)?.color || CATEGORY_COLORS[tx.category] || '#999' }}
                                                >
                                                    {tx.category}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    {/* We can re-use helper icon if we export it or inline SVG */}
                                                    <span>{ACCOUNT_TYPE_LABELS[tx.accountType || 'bank']}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-700">{tx.description}</td>
                                            <td className={`p-4 text-sm font-bold text-right ${tx.type === 'income' ? 'text-emerald-600' :
                                                tx.type === 'carryover' ? 'text-indigo-600' : 'text-rose-600'
                                                }`}>
                                                {tx.type === 'income' || tx.type === 'carryover' ? '+' : '-'}{tx.amount.toFixed(2)} €
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => onTransactionClick(tx)}
                                                    className="text-gray-400 hover:text-indigo-600 transition-colors p-2 hover:bg-indigo-50 rounded-full"
                                                    title="Detail"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
