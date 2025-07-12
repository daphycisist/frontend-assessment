import { describe, it, expect } from 'vitest';
import { generateTransactionData, calculateSummary } from '../dataGenerator';

describe('dataGenerator', () => {
  it('should generate the requested number of transactions', () => {
    const txns = generateTransactionData(100);
    expect(txns).toHaveLength(100);
  });

  it('should calculate summary totals correctly', () => {
    const txns = generateTransactionData(10);
    const summary = calculateSummary(txns);
    const amountSum = txns.reduce((s, t) => s + t.amount, 0);
    expect(summary.totalAmount).toBeCloseTo(amountSum);
    expect(summary.totalTransactions).toBe(10);
  });
});
