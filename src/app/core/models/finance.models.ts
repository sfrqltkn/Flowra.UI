export type TransactionType = 'income' | 'expense';

export interface CashStatus {
  bankName?: string;
  balance: number;
}

export interface Income {
  id?: number;
  name: string;
  amount: number;
  date: Date | string;
  isRecurring: boolean;
}

export interface Expense {
  id?: number;
  name: string;
  totalAmount: number;
  date: Date | string;
  isCreditCard: boolean;
  minimumPaymentAmount?: number;
  isPaid: boolean;
  isRecurring: boolean;
}

export interface Allowance {
  id?: number;
  personName: string;
  amount: number;
}

export interface Asset {
  id?: number;
  monthYear: string;
  name: string;
  type: string;
  amount: number;
  estimatedUnitValue: number;
}

export interface CashRecord {
  id?: number;
  monthYear: string;
  balance: number;
  updatedAt?: Date | string;
}
