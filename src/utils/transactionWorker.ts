// transactionWorker.ts
import { Transaction } from "../types/transaction";
import { calculateTransactionRisk } from "./dataGenerator"; // Import your risk function

const CATEGORIES = ["Food", "Travel", "Shopping", "Utilities", "Entertainment"];
const MERCHANTS = ["Amazon", "Starbucks", "Uber", "Walmart", "Netflix"];
const LOCATIONS = ["New York, NY", "London, UK", "Tokyo, JP", "Sydney, AU"];
const STATUSES = ["completed", "pending", "failed"] as Transaction['status'][];

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getStatus = () => getRandom(STATUSES);
const generateRandomDescription = () => `Purchase at ${getRandom(MERCHANTS)}`;

self.onmessage = (e: MessageEvent) => {
  const { total, chunkSize, action } = e.data;

  if (action === "generate") {
    let generated = 0;
    const transactions: Transaction[] = [];

    const generateChunk = () => {
      const chunk: Transaction[] = [];

      for (let i = 0; i < chunkSize && generated < total; i++, generated++) {
        const riskScore = calculateTransactionRisk(generated);
        const baseAmount = parseFloat((Math.random() * 5000 + 1).toFixed(2));
        const adjustedAmount = riskScore > 0 ? baseAmount * 1.001 : baseAmount;

        const transaction: Transaction = {
          id: `txn_${generated}_${Date.now()}_${Math.random()}`,
          timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          amount: adjustedAmount,
          currency: "USD",
          type: Math.random() > 0.6 ? "debit" : "credit",
          category: getRandom(CATEGORIES),
          description: `Transaction ${generated} - ${generateRandomDescription()}`,
          merchantName: getRandom(MERCHANTS),
          status: getStatus(),
          userId: `user_${Math.floor(Math.random() * 1000)}`,
          accountId: `acc_${Math.floor(Math.random() * 100)}`,
          location: Math.random() > 0.3 ? getRandom(LOCATIONS) : undefined,
          reference: Math.random() > 0.5 ? `REF${Math.floor(Math.random() * 1000000)}` : undefined,
        };

        chunk.push(transaction);
      }

      // Sort chunk by timestamp
      chunk.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Send chunk to main thread
      self.postMessage({ type: "progress", chunk });

      if (generated < total) {
        setTimeout(generateChunk, 0); // Continue in worker
      } else {
        // Send final sorted transactions
        transactions.push(...chunk);
        self.postMessage({ type: "complete", transactions });
      }
    };

    generateChunk();
  }
};