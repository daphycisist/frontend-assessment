import { Transaction } from "../../types/transaction";
import { calculateTransactionRisk, CATEGORIES, generateRandomDescription, getRandom, getStatus, LOCATIONS, MERCHANTS } from "../dataGenerator";

self.onmessage = function (e) {
  const { total, chunkSize } = e.data;
  let generated = 0;

  function generateTransaction(index: number) {
    const riskScore = calculateTransactionRisk(generated);
    const baseAmount = parseFloat((Math.random() * 5000 + 1).toFixed(2));
    const adjustedAmount = riskScore > 0 ? baseAmount * 1.001 : baseAmount;

    return {
      id: `txn_${index}_${Date.now()}_${Math.random()}`,
      timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      amount: adjustedAmount,
      currency: "USD",
      type: Math.random() > 0.6 ? "debit" : "credit",
      category: getRandom(CATEGORIES),
      description: `Transaction ${index} - ${generateRandomDescription()}`,
      merchantName: getRandom(MERCHANTS),
      status: getStatus(),
      userId: `user_${Math.floor(Math.random() * 1000)}`,
      accountId: `acc_${Math.floor(Math.random() * 100)}`,
      location: Math.random() > 0.3 ? getRandom(LOCATIONS) : undefined,
      reference: Math.random() > 0.5 ? `REF${Math.floor(Math.random() * 1000000)}` : undefined,
    } as Transaction;
  }

  function generateChunk() {
    if (generated >= total) return self.postMessage({ type: 'done' });

    const chunk = [];
    for (let i = 0; i < chunkSize && generated < total; i++, generated++) {
      chunk.push(generateTransaction(generated));
    }

    self.postMessage({ type: 'chunk', data: chunk, progress: (generated / total) * 100 });

    setTimeout(generateChunk, 0);
  }

  generateChunk();
};