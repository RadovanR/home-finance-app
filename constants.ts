import { Category, Transaction, AccountType } from './types';

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  bank: 'Bankový účet',
  cash: 'Hotovosť',
  meal_voucher: 'Stravné lístky'
};

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const CATEGORY_COLORS: Record<string, string> = {
  [Category.FOOD]: '#f59e0b', // Amber
  [Category.HOUSING]: '#3b82f6', // Blue
  [Category.RENT]: '#1e40af', // Dark Blue
  [Category.TRANSPORT]: '#6366f1', // Indigo
  [Category.SUBSCRIPTION]: '#0ea5e9', // Sky
  [Category.LOAN]: '#9f1239', // Rose dark
  [Category.ENTERTAINMENT]: '#ec4899', // Pink
  [Category.VACATION]: '#06b6d4', // Cyan
  [Category.GIFTS]: '#d946ef', // Fuchsia
  [Category.HEALTH]: '#ef4444', // Red
  [Category.SHOPPING]: '#8b5cf6', // Violet
  [Category.SALARY]: '#10b981', // Emerald
  [Category.REFUELING]: '#f97316', // Orange
  [Category.BALANCE]: '#0d9488', // Teal
  [Category.ADVANCE]: '#eab308', // Yellow-600
  [Category.SAVINGS]: '#22c55e', // Green-500
  [Category.HEALTH_INSURANCE]: '#be123c', // Rose-700
  [Category.SOCIAL_INSURANCE]: '#4f46e5', // Indigo-600 (Darker)
  [Category.TAX]: '#7f1d1d', // Red-900
  [Category.OTHER]: '#64748b', // Slate
};

export const MEAL_VOUCHER_VALUE = 6.60;

export const MONTH_NAMES_SK = [
  'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
  'Júl', 'August', 'September', 'Október', 'November', 'December'
];