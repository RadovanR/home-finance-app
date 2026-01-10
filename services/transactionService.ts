
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { supabase } from './supabaseClient';
import { Transaction, Budget, TransactionType, Category, AccountType } from '../types';

// Map DB row to Transaction object
const mapTransactionFromDB = (data: any): Transaction => ({
    id: data.id,
    date: data.date,
    amount: Number(data.amount),
    type: data.type as TransactionType,
    category: data.category as Category,
    accountType: (data.account_type || 'bank') as AccountType,
    description: data.description || '',
    person: data.person || 'Osoba 1',
});

// Map Transaction object to DB row (for insert)
const mapTransactionToDB = (tx: Omit<Transaction, 'id'>) => ({
    date: tx.date,
    amount: tx.amount,
    type: tx.type,
    category: tx.category,
    account_type: tx.accountType,
    description: tx.description,
    person: tx.person,
});

export const fetchTransactions = async (): Promise<Transaction[]> => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }

    return data.map(mapTransactionFromDB);
};

export const addTransaction = async (tx: Omit<Transaction, 'id'>): Promise<Transaction | null> => {
    const dbRow = mapTransactionToDB(tx);
    const { data, error } = await supabase
        .from('transactions')
        .insert([dbRow])
        .select()
        .single();

    if (error) {
        console.error('Error adding transaction:', error);
        return null;
    }

    return mapTransactionFromDB(data);
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting transaction:', error);
        return false;
    }
    return true;
};

export const deleteTransactionsByMonth = async (date: Date): Promise<boolean> => {
    const start = format(startOfMonth(date), 'yyyy-MM-dd');
    const end = format(endOfMonth(date), 'yyyy-MM-dd');

    const { error } = await supabase
        .from('transactions')
        .delete()
        .gte('date', start)
        .lte('date', end);

    if (error) {
        console.error('Error deleting transactions by month:', error);
        return false;
    }
    return true;
};

export const fetchBudget = async (month: string): Promise<Budget | null> => {
    const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('month', month)
        .single();

    if (error) {
        // If multiple found (shouldn't happen with unique) or none found
        if (error.code !== 'PGRST116') {
            console.error('Error fetching budget:', error);
        }
        return null;
    }

    return {
        amount: Number(data.amount),
        month: data.month,
    };
};

export const upsertBudget = async (budget: Budget): Promise<Budget | null> => {
    const { data, error } = await supabase
        .from('budgets')
        .upsert(
            { month: budget.month, amount: budget.amount },
            { onConflict: 'month' }
        )
        .select()
        .single();

    if (error) {
        console.error('Error saving budget:', error);
        return null;
    }

    return {
        amount: Number(data.amount),
        month: data.month,
    };
};

export const updateTransaction = async (tx: Transaction): Promise<Transaction | null> => {
    const dbRow = mapTransactionToDB(tx);
    const { data, error } = await supabase
        .from('transactions')
        .update(dbRow)
        .eq('id', tx.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating transaction:', error);
        return null;
    }

    return mapTransactionFromDB(data);
};
