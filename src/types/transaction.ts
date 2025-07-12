import { TxType, TxStatus } from '../constants/transactions';

export interface Transaction {
  id: string;
  timestamp: Date;
  amount: number;
  currency: string;
  type: TxType;
  category: string;
  description: string;
  merchantName: string;
  status: TxStatus;
  userId: string;
  accountId: string;
  location?: string;
  reference?: string;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  totalCredits: number;
  totalDebits: number;
  avgTransactionAmount: number;
  categoryCounts: Record<string, number>;
}

export interface FilterOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  type?: TxType | 'all';
  category?: string;
  status?: TxStatus | 'all';
  searchTerm?: string;
}
