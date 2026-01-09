
import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  History,
  Settings,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Sparkles,
  PieChart as PieChartIcon,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CreditCard,
  Banknote,
  Ticket
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  parseISO,
  getDay
} from 'date-fns';
import { sk } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

import { Transaction, Budget, Category, AiPrediction, AccountType } from './types';
import { CATEGORY_COLORS, MONTH_NAMES_SK, ACCOUNT_TYPE_LABELS } from './constants';
import { TransactionModal } from './components/TransactionModal';
import { DayDetailModal } from './components/DayDetailModal';
import { BudgetModal } from './components/BudgetModal';
import { BalanceModal } from './components/BalanceModal';
import { getFinancialPrediction } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import {
  fetchTransactions,
  addTransaction,
  deleteTransaction,
  fetchBudget,
  upsertBudget,
  deleteTransactionsByMonth
} from './services/transactionService';

// --- Helper Components within App.tsx for Simplicity ---

const StatCard: React.FC<{
  title: string;
  amount: number;
  icon: React.ReactNode;
  colorClass: string;
  onClick?: () => void;
  isClickable?: boolean;
}> = ({ title, amount, icon, colorClass, onClick, isClickable }) => (
  <div
    className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between ${isClickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    onClick={onClick}
  >
    <div>
      <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{amount.toFixed(2)} €</h3>
    </div>
    <div className={`p-3 rounded-full ${colorClass}`}>
      {icon}
    </div>
  </div>
);

const getAccountIcon = (type: AccountType) => {
  switch (type) {
    case 'bank': return <CreditCard size={14} className="text-indigo-500" />;
    case 'cash': return <Banknote size={14} className="text-emerald-500" />;
    case 'meal_voucher': return <Ticket size={14} className="text-orange-500" />;
    default: return <CreditCard size={14} className="text-gray-400" />;
  }
};


const App: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'history' | 'prediction'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<Budget>({ amount: 2000, month: format(new Date(), 'yyyy-MM') });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // Generic Breakdown Modal State
  const [breakdownData, setBreakdownData] = useState<{
    isOpen: boolean;
    title: string;
    totalLabel: string;
    balances: Record<AccountType, number>;
  }>({
    isOpen: false,
    title: '',
    totalLabel: '',
    balances: { bank: 0, cash: 0, meal_voucher: 0 }
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [prediction, setPrediction] = useState<AiPrediction | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // --- Effects ---

  // Load Transactions on Mount
  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      const data = await fetchTransactions();
      setTransactions(data);
      setIsLoading(false);
    };
    loadTransactions();
  }, []);

  // Load Budget when Month Changes
  useEffect(() => {
    const loadBudget = async () => {
      const monthStr = format(currentDate, 'yyyy-MM');
      const loadedBudget = await fetchBudget(monthStr);
      if (loadedBudget) {
        setBudget(loadedBudget);
      } else {
        setBudget({ amount: 2000, month: monthStr });
      }
    };
    loadBudget();
  }, [currentDate]);

  // Real-time Subscriptions
  useEffect(() => {
    // Subscription for Transactions
    const transactionsSubscription = supabase
      .channel('transactions_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        async () => {
          // Reload transactions on any change
          const data = await fetchTransactions();
          setTransactions(data);
        }
      )
      .subscribe();

    // Subscription for Budgets
    const budgetSubscription = supabase
      .channel('budgets_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets' },
        async (payload) => {
          // Reload budget only if it might affect the current view, 
          // or just reload current month's budget to be safe.
          const monthStr = format(currentDate, 'yyyy-MM');
          // Optimization: Check if the changed budget is for the current month
          // payload.new or payload.old has the 'month' column ideally.
          // But simply reloading is safer and fast enough.
          const loadedBudget = await fetchBudget(monthStr);
          if (loadedBudget) {
            setBudget(loadedBudget);
          } else {
            setBudget({ amount: 2000, month: monthStr });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionsSubscription);
      supabase.removeChannel(budgetSubscription);
    };
  }, [currentDate]);

  // --- Derived State ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => isSameMonth(parseISO(t.date), currentDate));
  }, [transactions, currentDate]);

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const budgetableExpense = filteredTransactions
    .filter(t => t.type === 'expense' && t.category !== Category.SAVINGS && t.category !== Category.ADVANCE)
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const budgetProgress = (budgetableExpense / budget.amount) * 100;

  const categoryData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const accountBalances = useMemo(() => {
    // Calculate balances from ALL transactions to get correct current state
    const balances = {
      bank: 0,
      cash: 0,
      meal_voucher: 0
    };
    transactions.forEach(t => {
      const type = t.accountType || 'bank';
      if (t.type === 'income') {
        balances[type as keyof typeof balances] += t.amount;
      } else {
        balances[type as keyof typeof balances] -= t.amount;
      }
    });
    return balances;
  }, [transactions]);

  const totalBalance = useMemo(() => {
    return (Object.values(accountBalances) as number[]).reduce((acc, val) => acc + val, 0);
  }, [accountBalances]);

  const monthlyIncomeBreakdown = useMemo(() => {
    const balances = { bank: 0, cash: 0, meal_voucher: 0 };
    filteredTransactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const type = t.accountType || 'bank';
        balances[type as keyof typeof balances] += t.amount;
      });
    return balances;
  }, [filteredTransactions]);

  const monthlyExpenseBreakdown = useMemo(() => {
    const balances = { bank: 0, cash: 0, meal_voucher: 0 };
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const type = t.accountType || 'bank';
        balances[type as keyof typeof balances] += t.amount;
      });
    return balances;
  }, [filteredTransactions]);

  const openBreakdown = (type: 'income' | 'expense' | 'balance') => {
    if (type === 'balance') {
      setBreakdownData({
        isOpen: true,
        title: 'Detail Zostatkov (Celkový)',
        totalLabel: 'Aktuálny stav financií',
        balances: accountBalances
      });
    } else if (type === 'income') {
      setBreakdownData({
        isOpen: true,
        title: 'Detail Príjmov (Mesačný)',
        totalLabel: 'Celkové príjmy tento mesiac',
        balances: monthlyIncomeBreakdown
      });
    } else if (type === 'expense') {
      setBreakdownData({
        isOpen: true,
        title: 'Detail Výdavkov (Mesačný)',
        totalLabel: 'Celkové výdavky tento mesiac',
        balances: monthlyExpenseBreakdown
      });
    }
  };

  // --- Handlers ---
  const handleAddTransaction = async (newTx: Omit<Transaction, 'id'>) => {
    const savedTx = await addTransaction(newTx);
    if (savedTx) {
      setTransactions(prev => [savedTx, ...prev]);
    } else {
      alert('Chyba pri ukladaní transakcie.');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Naozaj chcete vymazať túto transakciu?')) {
      const success = await deleteTransaction(id);
      if (success) {
        setTransactions(prev => prev.filter(t => t.id !== id));
      } else {
        alert('Chyba pri mazaní transakcie.');
      }
    }
  };

  const handleSaveBudget = async (newAmount: number) => {
    const monthStr = format(currentDate, 'yyyy-MM');
    const newBudget: Budget = { amount: newAmount, month: monthStr };
    const saved = await upsertBudget(newBudget);
    if (saved) {
      setBudget(saved);
    } else {
      alert('Chyba pri ukladaní rozpočtu.');
    }
  };

  const handlePredict = async () => {
    setIsPredicting(true);
    const result = await getFinancialPrediction(transactions, format(currentDate, 'yyyy-MM'));
    setPrediction(result);
    setIsPredicting(false);
  };

  const handleResetData = async () => {
    const monthName = MONTH_NAMES_SK[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    const currentMonthStr = format(currentDate, 'yyyy-MM');

    if (window.confirm(`Naozaj chcete vymazať všetky dáta pre ${monthName} ${year}? Táto akcia sa nedá vrátiť.`)) {
      // 1. Delete transactions
      const deleteTransactionsSuccess = await deleteTransactionsByMonth(currentDate);

      // 2. Reset budget to 2000
      const newBudget: Budget = { amount: 2000, month: currentMonthStr };
      const resetBudgetResult = await upsertBudget(newBudget);

      if (deleteTransactionsSuccess && resetBudgetResult) {
        // Update local state
        setTransactions(prev => prev.filter(t => !isSameMonth(parseISO(t.date), currentDate)));
        setBudget(resetBudgetResult);
      } else {
        alert('Nastala chyba pri resetovaní dát (transakcie alebo rozpočet).');
      }
    }
  };

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // --- Render Views ---

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {MONTH_NAMES_SK[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex space-x-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
            <ChevronLeft />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="cursor-pointer" onClick={() => openBreakdown('income')}>
          <StatCard
            title="Celkové Príjmy"
            amount={totalIncome}
            icon={<TrendingUp className="text-emerald-600" />}
            colorClass="bg-emerald-100 hover:bg-emerald-200 transition-colors"
            isClickable={true}
          />
        </div>
        <div className="cursor-pointer" onClick={() => openBreakdown('expense')}>
          <StatCard
            title="Celkové Výdavky"
            amount={totalExpense}
            icon={<TrendingDown className="text-rose-600" />}
            colorClass="bg-rose-100 hover:bg-rose-200 transition-colors"
            isClickable={true}
          />
        </div>
        <div className="cursor-pointer" onClick={() => openBreakdown('balance')}>
          <StatCard
            title="Aktuálny Zostatok"
            amount={totalBalance}
            icon={<Wallet className="text-indigo-600" />}
            colorClass="bg-indigo-100 hover:bg-indigo-200 transition-colors"
            isClickable={true}
          />
        </div>
      </div>

      {/* Budget & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Progress */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Mesačný Rozpočet</h3>
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="text-sm text-indigo-600 font-medium hover:underline bg-indigo-50 px-3 py-1 rounded-full transition-colors hover:bg-indigo-100"
            >
              Upraviť
            </button>
          </div>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                  Čerpanie
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-indigo-600">
                  {Math.min(100, Math.round(budgetProgress))}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-100">
              <div
                style={{ width: `${Math.min(100, budgetProgress)}%` }}
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ease-out ${budgetProgress > 100 ? 'bg-rose-500' : 'bg-indigo-500'}`}
              ></div>
            </div>
            <p className="text-sm text-gray-500">
              Minuli ste <span className="font-bold text-gray-900">{budgetableExpense.toFixed(2)}€</span> z <span className="font-bold text-gray-900">{budget.amount}€</span>
            </p>
          </div>
        </div>

        {/* Expenses Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-[300px]">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 w-full text-left">Rozloženie Výdavkov</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#ccc'} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => `${value.toFixed(2)} €`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-400">Zatiaľ žiadne výdavky tento mesiac.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions List (Brief) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Posledné Transakcie</h3>
          <button
            onClick={() => setActiveTab('history')}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Zobraziť všetky
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredTransactions.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map((tx) => (
            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: CATEGORY_COLORS[tx.category] || '#ccc' }}
                >
                  {tx.category.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{tx.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span className="font-semibold text-indigo-600">{tx.person}</span>
                    <span>•</span>
                    <span>{tx.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1" title={ACCOUNT_TYPE_LABELS[tx.accountType || 'bank']}>
                      {getAccountIcon(tx.accountType || 'bank')}
                      <span className="hidden sm:inline">{ACCOUNT_TYPE_LABELS[tx.accountType || 'bank']}</span>
                    </span>
                    <span>•</span>
                    <span>{format(parseISO(tx.date), 'd. MMMM', { locale: sk })}</span>
                  </div>
                </div>
              </div>
              <span className={`font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)} €
              </span>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <div className="p-8 text-center text-gray-500">Žiadne transakcie pre tento mesiac.</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const dateRange = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Start day offset (0 = Sunday, 1 = Monday...)
    // European week starts on Monday (1). Adjust so Mon=0, Sun=6
    const startDay = getDay(monthStart);
    const offset = startDay === 0 ? 6 : startDay - 1;

    const emptyDays = Array.from({ length: offset });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Kalendár: {MONTH_NAMES_SK[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex space-x-2">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
              <ChevronLeft />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
              <ChevronRight />
            </button>
          </div>
        </div>

        {/* Monthly Summary in Calendar */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Príjmy</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-700">+{totalIncome.toFixed(2)} €</span>
          </div>
          <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Výdavky</span>
            <span className="text-lg sm:text-xl font-bold text-rose-700">-{totalExpense.toFixed(2)} €</span>
          </div>
          <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Zostatok</span>
            <span className={`text-lg sm:text-xl font-bold ${balance >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
              {balance >= 0 ? '+' : ''}{balance.toFixed(2)} €
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-semibold text-gray-500">
            <div>Po</div><div>Ut</div><div>St</div><div>Št</div><div>Pi</div><div>So</div><div>Ne</div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {emptyDays.map((_, i) => <div key={`empty-${i}`} className="h-24 sm:h-32"></div>)}

            {dateRange.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayTxs = transactions.filter(t => t.date === dayStr);
              const dayExpense = dayTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
              const dayIncome = dayTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

              return (
                <div
                  key={day.toISOString()}
                  className={`border rounded-lg p-2 h-24 sm:h-32 flex flex-col justify-between transition-all hover:shadow-md cursor-pointer ${isSameDay(day, new Date()) ? 'bg-indigo-50 border-indigo-200' : 'border-gray-100'}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'text-indigo-600' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </span>

                  <div className="space-y-1">
                    {dayIncome > 0 && (
                      <div className="text-xs bg-emerald-100 text-emerald-700 px-1 rounded truncate">
                        +{dayIncome}
                      </div>
                    )}
                    {dayExpense > 0 && (
                      <div className="text-xs bg-rose-100 text-rose-700 px-1 rounded truncate">
                        -{dayExpense}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">História Transakcií</h2>
        <div className="text-sm text-gray-500">
          {MONTH_NAMES_SK[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                <th className="p-4 font-semibold">Dátum</th>
                <th className="p-4 font-semibold">Osoba</th>
                <th className="p-4 font-semibold">Kategória</th>
                <th className="p-4 font-semibold">Účet</th>
                <th className="p-4 font-semibold">Popis</th>
                <th className="p-4 font-semibold text-right">Suma</th>
                <th className="p-4 font-semibold text-center">Akcia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">Žiadne dáta pre tento mesiac.</td>
                </tr>
              ) : (
                filteredTransactions
                  .slice()
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-600">{format(parseISO(tx.date), 'd.M.yyyy')}</td>
                      <td className="p-4 text-sm text-gray-900 font-medium">{tx.person}</td>
                      <td className="p-4">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: CATEGORY_COLORS[tx.category] || '#999' }}
                        >
                          {tx.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {getAccountIcon(tx.accountType || 'bank')}
                          <span>{ACCOUNT_TYPE_LABELS[tx.accountType || 'bank']}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-700">{tx.description}</td>
                      <td className={`p-4 text-sm font-bold text-right ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)} €
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <TrendingDown size={16} className="transform rotate-45" /> {/* Using generic icon as X */}
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPrediction = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Sparkles className="text-yellow-500" /> AI Finančný Asistent
      </h2>

      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-8 text-white shadow-lg">
        <h3 className="text-xl font-bold mb-4">Získajte predikciu na ďalší mesiac</h3>
        <p className="opacity-90 mb-6 max-w-xl">
          Naša AI analyzuje vašu históriu výdavkov a príjmov, aby odhadla, koľko miniete budúci mesiac a poskytla vám tipy na šetrenie.
        </p>

        <button
          onClick={handlePredict}
          disabled={isPredicting}
          className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold shadow-md hover:bg-indigo-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPredicting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              Analyzujem dáta...
            </>
          ) : (
            <>Generovať predikciu</>
          )}
        </button>
      </div>

      {prediction && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 className="text-gray-500 font-medium mb-2 uppercase text-xs tracking-wider">Odhadované výdavky</h4>
            <div className="text-4xl font-bold text-gray-900 mb-4">
              ~{prediction.predictedTotal} €
            </div>
            <p className="text-gray-600 leading-relaxed">
              {prediction.reasoning}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 className="text-gray-500 font-medium mb-4 uppercase text-xs tracking-wider">Tipy na šetrenie</h4>
            <ul className="space-y-3">
              {prediction.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="bg-emerald-100 text-emerald-600 p-1 rounded mt-1">
                    <Sparkles size={14} />
                  </div>
                  <span className="text-gray-700 text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="w-20 lg:w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-10">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-100">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            F
          </div>
          <span className="ml-3 font-bold text-gray-800 hidden lg:block">Financie</span>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-2 lg:px-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutDashboard size={20} />
            <span className="ml-3 font-medium hidden lg:block">Prehľad</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'calendar' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <CalendarIcon size={20} />
            <span className="ml-3 font-medium hidden lg:block">Kalendár</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <History size={20} />
            <span className="ml-3 font-medium hidden lg:block">História</span>
          </button>

          <button
            onClick={() => setActiveTab('prediction')}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === 'prediction' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Sparkles size={20} />
            <span className="ml-3 font-medium hidden lg:block">AI Predikcia</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-4">
          <button
            onClick={handleResetData}
            className="w-full flex items-center p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors text-sm"
          >
            <Trash2 size={18} />
            <span className="ml-3 font-medium hidden lg:block">Resetovať dáta</span>
          </button>

          <div className="flex items-center p-2 rounded-lg bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
              RD
            </div>
            <div className="ml-3 hidden lg:block">
              <p className="text-sm font-medium text-gray-900">Rodina</p>
              <p className="text-xs text-gray-500">Free Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Nav Bottom */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 z-20">
        <button onClick={() => setActiveTab('dashboard')} className={`p-2 rounded-lg ${activeTab === 'dashboard' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}>
          <LayoutDashboard size={24} />
        </button>
        <button onClick={() => setActiveTab('calendar')} className={`p-2 rounded-lg ${activeTab === 'calendar' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}>
          <CalendarIcon size={24} />
        </button>
        <button onClick={() => setIsModalOpen(true)} className="p-3 -mt-8 bg-indigo-600 text-white rounded-full shadow-lg">
          <Plus size={24} />
        </button>
        <button onClick={() => setActiveTab('history')} className={`p-2 rounded-lg ${activeTab === 'history' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}>
          <History size={24} />
        </button>
        <button onClick={() => setActiveTab('prediction')} className={`p-2 rounded-lg ${activeTab === 'prediction' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}>
          <Sparkles size={24} />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-20 lg:ml-64 p-4 lg:p-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Mobile - Just Title */}
          <div className="md:hidden mb-6 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">Domáce Financie</h1>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">F</div>
          </div>

          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'calendar' && renderCalendar()}
          {activeTab === 'history' && renderHistory()}
          {activeTab === 'prediction' && renderPrediction()}
        </div>
      </main>

      {/* FAB Desktop */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="hidden md:flex fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 items-center gap-2 group z-30"
      >
        <Plus size={24} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-medium whitespace-nowrap">
          Nová transakcia
        </span>
      </button>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddTransaction}
      />

      <DayDetailModal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        date={selectedDate}
        transactions={selectedDate ? transactions.filter(t => t.date === format(selectedDate, 'yyyy-MM-dd')) : []}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        currentAmount={budget.amount}
        onSave={handleSaveBudget}
      />

      <BalanceModal
        isOpen={breakdownData.isOpen}
        onClose={() => setBreakdownData(prev => ({ ...prev, isOpen: false }))}
        balances={breakdownData.balances}
        title={breakdownData.title}
        totalLabel={breakdownData.totalLabel}
      />
    </div>
  );
};

export default App;