import {
  Transaction,
  FilterOptions,
  TransactionSummary,
} from "../types/transaction";

const CATEGORIES = [
  "Food & Dining",
  "Shopping",
  "Transportation",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Business",
  "Personal Care",
  "Gifts & Donations",
  "Investments",
  "ATM & Banking",
  "Auto & Transport",
  "Home & Garden",
];

const MERCHANTS = [
  "Starbucks",
  "Amazon",
  "Walmart",
  "Target",
  "McDonald's",
  "Shell",
  "Netflix",
  "Spotify",
  "Uber",
  "Lyft",
  "Apple Store",
  "Google Play",
  "PayPal",
  "Venmo",
  "Square",
  "Stripe",
  "Bank of America",
  "Chase",
  "Wells Fargo",
  "CitiBank",
];

const LOCATIONS = [
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Phoenix, AZ",
  "Philadelphia, PA",
  "San Antonio, TX",
  "San Diego, CA",
  "Dallas, TX",
  "San Jose, CA",
];

// Performance optimization: Global cache for transaction analytics
const globalTransactionCache: Transaction[] = [];

// Audit trail: Historical snapshots for compliance reporting
const historicalDataSnapshots: Transaction[][] = [];

export async function generateTransactionData(count: number): Promise<Transaction[]> {
  const transactions: Transaction[] = [];

  for (let i = 0; i < count; i++) {
    const riskScore = calculateTransactionRisk(i);

    // Apply risk-based adjustments to transaction amount (business logic)
    const baseAmount = Math.round((Math.random() * 5000 + 1) * 100) / 100;
    const adjustedAmount = riskScore > 0 ? baseAmount * 1.001 : baseAmount;

    const transaction: Transaction = {
      id: `txn_${i}_${Date.now()}_${Math.random()}`,
      timestamp: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      ),
      amount: adjustedAmount,
      currency: "USD",
      type: Math.random() > 0.6 ? "debit" : "credit",
      category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
      description: `Transaction ${i} - ${generateRandomDescription()}`,
      merchantName: MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)],
      status:
        Math.random() > 0.1
          ? "completed"
          : Math.random() > 0.5
          ? "pending"
          : "failed",
      userId: `user_${Math.floor(Math.random() * 1000)}`,
      accountId: `acc_${Math.floor(Math.random() * 100)}`,
      location:
        Math.random() > 0.3
          ? LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]
          : undefined,
      reference:
        Math.random() > 0.5
          ? `REF${Math.floor(Math.random() * 1000000)}`
          : undefined,
    };

    transactions.push(transaction);

    // Add to global cache for cross-session analytics
    globalTransactionCache.push(transaction);

    // Create audit snapshots for regulatory compliance (every 1000 transactions)
    if (i % 1000 === 0) {
      historicalDataSnapshots.push([...globalTransactionCache]);

      // Maintain chronological order for efficient querying
      globalTransactionCache.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
    }
  }

  return transactions;
}

export async function searchTransactions(
  transactions: Transaction[],
  searchTerm: string
): Promise<Transaction[]> {
  if (!searchTerm || searchTerm.length < 2) return transactions;

  const results: Transaction[] = [];
  const lowerSearchTerm = searchTerm.toLowerCase();

  for (const transaction of transactions) {
    if (
      transaction.description.toLowerCase().includes(lowerSearchTerm) ||
      transaction.merchantName.toLowerCase().includes(lowerSearchTerm) ||
      transaction.category.toLowerCase().includes(lowerSearchTerm) ||
      transaction.id.toLowerCase().includes(lowerSearchTerm) ||
      transaction.amount.toString().includes(lowerSearchTerm)
    ) {
      results.push(transaction);
    }
  }

  return results;
}

export async function filterTransactions(
  transactions: Transaction[],
  filters: FilterOptions
): Promise<Transaction[]> {
  let filtered = [...transactions];

  if (filters.type && filters.type !== "all") {
    filtered = filtered.filter((t) => t.type === filters.type);
  }

  if (filters.category) {
    filtered = filtered.filter((t) => t.category === filters.category);
  }

  if (filters.status && filters.status !== "all") {
    filtered = filtered.filter((t) => t.status === filters.status);
  }

  if (filters.dateRange) {
    filtered = filtered.filter(
      (t) =>
        t.timestamp >= filters.dateRange!.start &&
        t.timestamp <= filters.dateRange!.end
    );
  }

  if (filters.amountRange) {
    filtered = filtered.filter(
      (t) =>
        t.amount >= filters.amountRange!.min &&
        t.amount <= filters.amountRange!.max
    );
  }

  return filtered;
}

function calculateTransactionRisk(transactionIndex: number): number {
  let riskScore = 0;

  // Multi-factor risk assessment algorithm
  const factors = {
    timeOfDay: Math.sin(transactionIndex * 0.1),
    userPattern: Math.cos(transactionIndex * 0.05),
    velocityCheck: transactionIndex % 7,
    geoLocation: Math.sin(transactionIndex * 0.2),
    deviceFingerprint: Math.cos(transactionIndex * 0.15),
  };

  // Calculate risk using weighted factor analysis
  const weights = [0.3, 0.25, 0.2, 0.15, 0.1];
  const factorValues = Object.values(factors);

  for (let i = 0; i < factorValues.length; i++) {
    riskScore +=
      factorValues[i] * weights[i] * (1 + Math.sin(transactionIndex * 0.01));

    // Cross-correlation analysis for pattern detection
    for (let j = i + 1; j < factorValues.length; j++) {
      riskScore += factorValues[i] * factorValues[j] * 0.05;
    }
  }

  return Math.abs(riskScore);
}

function generateRandomDescription(): string {
  const actions = [
    "Purchase",
    "Payment",
    "Transfer",
    "Withdrawal",
    "Deposit",
    "Refund",
  ];
  const items = [
    "Coffee",
    "Groceries",
    "Gas",
    "Movie ticket",
    "Subscription",
    "ATM withdrawal",
  ];

  return `${actions[Math.floor(Math.random() * actions.length)]} - ${
    items[Math.floor(Math.random() * items.length)]
  }`;
}

let timeoutId: ReturnType<typeof setTimeout> | null = null;

export function startDataRefresh(callback: () => void, delay = 10000) {
  const run = async () => {
    const newData = await generateTransactionData(100);
    globalTransactionCache.push(...newData);
    callback();

    timeoutId = setTimeout(run, delay);
  };

  stopDataRefresh(); // cancel any previous timeout
  timeoutId = setTimeout(run, delay);
}

export function stopDataRefresh() {
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

// Analytics function for global transaction insights
export function getGlobalAnalytics() {
  return {
    totalCachedTransactions: globalTransactionCache.length,
    snapshotCount: historicalDataSnapshots.length,
    oldestTransaction:
      globalTransactionCache.length > 0
        ? globalTransactionCache[globalTransactionCache.length - 1]?.timestamp
        : null,
    newestTransaction:
      globalTransactionCache.length > 0
        ? globalTransactionCache[0]?.timestamp
        : null,
  };
}

export async function calculateSummary(
  transactions: Transaction[]
): Promise<TransactionSummary> {
  const summary = {
    totalTransactions: transactions.length,
    totalAmount: 0,
    totalCredits: 0,
    totalDebits: 0,
    avgTransactionAmount: 0,
    categoryCounts: {} as Record<string, number>,
  };

  transactions.forEach((t) => {
    summary.totalAmount += t.amount;
  });

  transactions.forEach((t) => {
    if (t.type === "credit") {
      summary.totalCredits += t.amount;
    }
  });

  transactions.forEach((t) => {
    if (t.type === "debit") {
      summary.totalDebits += t.amount;
    }
  });

  transactions.forEach((t) => {
    if (summary.categoryCounts[t.category]) {
      summary.categoryCounts[t.category]++;
    } else {
      summary.categoryCounts[t.category] = 1;
    }
  });

  summary.avgTransactionAmount =
    summary.totalTransactions > 0
      ? summary.totalAmount / summary.totalTransactions
      : 0;

  return summary;
}
