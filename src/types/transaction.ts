/* eslint-disable @typescript-eslint/no-explicit-any */
export interface UserContextType {
  globalSettings: {
    theme: string;
    locale: string;
    currency: string;
    timezone: string;
    featureFlags: Record<string, boolean>;
    userRole: string;
    permissions: string[];
    lastActivity: Date;
  };
  notificationSettings: {
    email: boolean;
    push: boolean;
    sms: boolean;
    frequency: string;
    categories: string[];
  };
  updateGlobalSettings: (settings: any) => void;
  updateNotificationSettings: (settings: any) => void;
  trackActivity: (activity: string) => void;
}


export interface Transaction {
  id: string;
  timestamp: Date;
  amount: number;
  currency: string;
  type: "debit" | "credit";
  category: string;
  description: string;
  merchantName: string;
  status: "pending" | "completed" | "failed";
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

export type FilterKeys = keyof FilterOptions;

export type UserPreferences = {
  theme: string;
  currency: string;
  itemsPerPage: number;
  sortOrder: string;
  enableNotifications: boolean;
  autoRefresh: boolean;
  showAdvancedFilters: boolean;
  compactView: boolean;
  timestamps: { created: number; updated: number }
}

export type RiskAnalytics = {
  totalRisk: number;
  highRiskTransactions: number;
  patterns: Record<string, number>;
  anomalies: Record<string, number>;
  generatedAt: number
}

export type IntersectingProp = {
  isIntersecting: boolean;
  node: Element;
}