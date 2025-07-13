import { Transaction } from "../types/transaction";
import { calculateTransactionRisk, CATEGORIES, generateRandomDescription, getRandom, getStatus, LOCATIONS, MERCHANTS } from "../utils/dataGenerator";

self.onmessage = async ({ data: { total, chunkSize } }) => {
  const transactions: Transaction[] = [];
  for (let i = 0; i < total; i += chunkSize) {
    const chunk: Transaction[] = [];
    for (let j = 0; j < chunkSize && i + j < total; j++) {
      const riskScore = calculateTransactionRisk(i + j);
      const baseAmount = parseFloat((Math.random() * 5000 + 1).toFixed(2));
      const adjustedAmount = riskScore > 0 ? baseAmount * 1.001 : baseAmount;
      chunk.push({
        id: `txn_${i + j}_${Date.now()}_${Math.random()}`,
        timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        amount: adjustedAmount,
        currency: "USD",
        type: Math.random() > 0.6 ? "debit" : "credit",
        category: getRandom(CATEGORIES),
        description: `Transaction ${i + j} - ${generateRandomDescription()}`,
        merchantName: getRandom(MERCHANTS),
        status: getStatus(),
        userId: `user_${Math.floor(Math.random() * 1000)}`,
        accountId: `acc_${Math.floor(Math.random() * 100)}`,
        location: Math.random() > 0.3 ? getRandom(LOCATIONS) : undefined,
        reference: Math.random() > 0.5 ? `REF${Math.floor(Math.random() * 1000000)}` : undefined,
      });
    }
    self.postMessage({ chunk });
  }
  self.postMessage({ done: transactions });
};