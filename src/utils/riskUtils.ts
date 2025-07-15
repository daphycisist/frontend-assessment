import { Transaction } from "../types/transaction";

// utils/riskUtils.ts
export const calculateRiskFactors = (transaction: Transaction, all: Transaction[]) => {
  if (!transaction?.amount || !transaction?.timestamp) {
    throw new Error("Transaction amount and timestamp are required");
  }

  const merchantHistory = all.filter(t => t.merchantName === transaction.merchantName);
  const merchantRisk = merchantHistory.length < 5 ? 0.8 : 0.2;
  const amountRisk = transaction.amount! > 1000 ? 0.6 : 0.1;
  const timeRisk = new Date(transaction.timestamp!).getHours() < 6 ? 0.4 : 0.1;

  return merchantRisk + amountRisk + timeRisk;
};

export const analyzeTransactionPatterns = (transaction: Transaction, all: Transaction[]) => {
  if (!transaction?.merchantName || !transaction?.amount || !transaction?.timestamp || !transaction?.userId) {
    throw new Error("Transaction merchantName, amount, timestamp, and userId are required");
  }

  const similar = all.filter(
    t => t.merchantName === transaction.merchantName && Math.abs(t.amount! - transaction.amount!) < 10
  );
  const velocity = all.filter(
    t => t.userId === transaction.userId &&
         Math.abs(new Date(t.timestamp!).getTime() - new Date(transaction.timestamp!).getTime()) < 3600000
  );

  let score = 0;
  if (similar.length > 3) score += 0.3;
  if (velocity.length > 5) score += 0.5;

  return score;
};

export const detectAnomalies = (transaction: Transaction, all: Transaction[]) => {
  if (!transaction?.amount || !transaction?.userId) {
    throw new Error("Transaction amount and userId are required");
  }
  
  const userTx = all.filter(t => t.userId === transaction.userId);
  if (userTx.length === 0) {
    throw new Error("No transactions found for user");
  }
  const avgAmount = userTx.reduce((sum, t) => sum + t.amount!, 0) / userTx.length;

  const amountDev = Math.abs(transaction.amount! - avgAmount) / avgAmount;
  const locationAnomaly = transaction.location &&
    !userTx.slice(-10).some(t => t.location === transaction.location) ? 0.4 : 0;

  return Math.min(amountDev * 0.3 + locationAnomaly, 1);
};
