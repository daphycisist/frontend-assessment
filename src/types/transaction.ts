export type TransactionStatus = "pending" | "completed" | "failed";

export interface Transaction {
  id: string;
  timestamp: Date;
  amount: number;
  currency: string;
  type: "debit" | "credit";
  category: string;
  description: string;
  merchantName: string;
  status: TransactionStatus;
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
  type?: "debit" | "credit" | "all";
  category?: string;
  status?: "pending" | "completed" | "failed" | "all";
  searchTerm?: string;
}
