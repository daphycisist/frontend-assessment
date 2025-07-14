import { Transaction } from '../types/transaction';
import { CATEGORIES, LOCATIONS, MERCHANTS } from '../constants';
import { calculateTransactionRisk, generateRandomDescription } from '../utils';


// Main data generation function
async function generateTransactionData(count: number): Promise<Transaction[]> {
  const transactions: Transaction[] = [];
  const batchSize = 1000; // Process in batches to avoid blocking
  
  for (let batch = 0; batch < Math.ceil(count / batchSize); batch++) {
    const batchStart = batch * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, count);
    
    for (let i = batchStart; i < batchEnd; i++) {
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
    }
    
    
    // Yield control back to the event loop between batches
    if (batch < Math.ceil(count / batchSize) - 1) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    // Send progress updates for large datasets
    if (count > 5000 && batch % 5 === 0) {
      self.postMessage({
        type: 'GENERATION_PROGRESS',
        progress: (batchEnd / count) * 100,
        generated: batchEnd,
        total: count
      });
    }
  }

  return transactions;
}

// Web Worker message handler
self.onmessage = async (event) => {
  const { type, count, id } = event.data;

  try {
    if (type === 'GENERATE_TRANSACTIONS') {
      const startTime = performance.now();
      const result = await generateTransactionData(count);
      const endTime = performance.now();
      
      self.postMessage({
        type: 'GENERATION_RESULT',
        result,
        id,
        success: true,
        processingTime: endTime - startTime,
        count: result.length
      });
    }
  } catch (error) {
    self.postMessage({
      type: 'GENERATION_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      id,
      success: false
    });
  }
};

export {};
