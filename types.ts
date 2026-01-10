export type TransactionType = 'income' | 'expense' | 'carryover';

export enum Category {
  FOOD = 'Potraviny',
  HOUSING = 'Bývanie',
  RENT = 'Nájom',
  TRANSPORT = 'Doprava',
  SUBSCRIPTION = 'Paušál',
  LOAN = 'Splátka',
  ENTERTAINMENT = 'Zábava',
  VACATION = 'Dovolenka',
  GIFTS = 'Darčeky',
  HEALTH = 'Zdravie',
  SHOPPING = 'Nákupy',
  SALARY = 'Výplata',
  REFUELING = 'Tankovanie',
  BALANCE = 'Zostatok',
  ADVANCE = 'Preddavok',
  SAVINGS = 'Úspory',
  HEALTH_INSURANCE = 'Zdravotné poistenie',
  SOCIAL_INSURANCE = 'Sociálne poistenie',
  TAX = 'Dane',
  OTHER = 'Iné'
}

export type AccountType = 'bank' | 'cash' | 'meal_voucher';

export interface Transaction {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  amount: number;
  type: TransactionType;
  category: Category | string;
  accountType: AccountType;
  description: string;
}

export interface Budget {
  amount: number;
  month: string; // YYYY-MM
}

export interface AiPrediction {
  predictedTotal: number;
  reasoning: string;
  tips: string[];
}

export interface CategoryItem {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  order?: number;
}