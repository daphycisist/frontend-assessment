/* eslint-disable @typescript-eslint/no-explicit-any */
// src/__tests__/riskUtils.test.ts
import { calculateRiskFactors, analyzeTransactionPatterns, detectAnomalies } from "../src/utils/riskUtils";
import { Transaction } from "../src/types/transaction";

describe("riskUtils", () => {
  // Mock transactions for testing
  const mockTransactions: Transaction[] = [
    {
      id: "txn_1",
      timestamp: new Date("2025-07-14T02:00:00Z"), // Early morning (high time risk)
      amount: 1200,
      currency: "USD",
      type: "credit",
      category: "Shopping",
      description: "Purchase at Amazon",
      merchantName: "Amazon",
      status: "completed",
      userId: "user_1",
      accountId: "acc_1",
      location: "New York",
    },
    {
      id: "txn_2",
      timestamp: new Date("2025-07-14T12:00:00Z"), // Midday (low time risk)
      amount: 500,
      currency: "USD",
      type: "credit",
      category: "Shopping",
      description: "Purchase at Amazon",
      merchantName: "Amazon",
      status: "completed",
      userId: "user_1",
      accountId: "acc_1",
      location: "New York",
    },
    {
      id: "txn_3",
      timestamp: new Date("2025-07-14T11:00:00Z"), // Within 1 hour of txn_2
      amount: 510,
      currency: "USD",
      type: "credit",
      category: "Shopping",
      description: "Purchase at Amazon",
      merchantName: "Amazon",
      status: "completed",
      userId: "user_1",
      accountId: "acc_1",
      location: "New York",
    },
    {
      id: "txn_4",
      timestamp: new Date("2025-07-14T12:00:00Z"),
      amount: 2000,
      currency: "USD",
      type: "credit",
      category: "Travel",
      description: "Flight booking",
      merchantName: "Expedia",
      status: "completed",
      userId: "user_2",
      accountId: "acc_2",
      location: "London",
    },
  ];

  describe("calculateRiskFactors", () => {
    it("calculates high risk for early morning, large amount, and few merchant transactions", () => {
      const transaction = mockTransactions[0]; // amount: 1200, time: 02:00, merchant: Amazon (3 txns)
      const result = calculateRiskFactors(transaction, mockTransactions);
      expect(result).toBeCloseTo(0.8 + 0.6 + 0.4);
    });

    it("calculates low risk for midday, small amount, and many merchant transactions", () => {
      const transaction = {
        ...mockTransactions[1],
        merchantName: "Walmart", // More than 5 transactions
      };
      const allTransactions = Array(6).fill({
        ...mockTransactions[1],
        merchantName: "Walmart",
      });
      const result = calculateRiskFactors(transaction, allTransactions);
      expect(result).toBeCloseTo(0.2 + 0.1 + 0.1);
    });

    it("handles empty transaction list", () => {
      const transaction = mockTransactions[0];
      const result = calculateRiskFactors(transaction, []);
      expect(result).toBeCloseTo(0.8 + 0.6 + 0.4);
    });

    it("handles undefined amount and timestamp", () => {
      const transaction: Transaction = {
        ...mockTransactions[0],
        amount: undefined,
        timestamp: undefined,
      } as any;
      expect(() => calculateRiskFactors(transaction, mockTransactions)).toThrow();
    });
  });

  describe("analyzeTransactionPatterns", () => {
    it("assigns high score for multiple similar transactions and high velocity", () => {
      const transaction = mockTransactions[1];
      const allTransactions = [
        ...mockTransactions,
        { ...mockTransactions[1], id: "txn_5", amount: 505 },
        { ...mockTransactions[1], id: "txn_6", amount: 495 },
        { ...mockTransactions[1], id: "txn_7", timestamp: new Date("2025-07-14T11:30:00Z") },
        { ...mockTransactions[1], id: "txn_8", timestamp: new Date("2025-07-14T11:45:00Z") },
        { ...mockTransactions[1], id: "txn_9", timestamp: new Date("2025-07-14T12:15:00Z") },
      ];
      const result = analyzeTransactionPatterns(transaction, allTransactions);
      expect(result).toBeCloseTo(0.3 + 0.5); // similar (>3) + velocity (>5) = 0.8
    });

    it("assigns zero score for no similar transactions or velocity", () => {
      const transaction = mockTransactions[3];
      const result = analyzeTransactionPatterns(transaction, mockTransactions);
      expect(result).toBe(0);
    });

    it("handles empty transaction list", () => {
      const transaction = mockTransactions[1];
      const result = analyzeTransactionPatterns(transaction, []);
      expect(result).toBe(0); // No matches
    });

    it("throws error for undefined merchantName, amount, timestamp, or userId", () => {
      const transaction: Transaction = {
        ...mockTransactions[1],
        merchantName: undefined,
        amount: undefined,
        timestamp: undefined,
        userId: undefined,
      } as any;
      expect(() => analyzeTransactionPatterns(transaction, mockTransactions)).toThrow(
        "Transaction merchantName, amount, timestamp, and userId are required"
      );
    });
  });

  describe("detectAnomalies", () => {
    it("detects high anomaly for large amount deviation and new location", () => {
      const transaction = {
        ...mockTransactions[0],
        amount: 5000,
        location: "Tokyo",
      };
      const avgAmount = (1200 + 500 + 510) / 3; // user_1 transactions
      const amountDev = Math.abs(5000 - avgAmount) / avgAmount;
      const result = detectAnomalies(transaction, mockTransactions);
      expect(result).toBeCloseTo(Math.min(amountDev * 0.3 + 0.4, 1), 2);
    });

    it("detects low anomaly for similar amount and known location", () => {
      const transaction = mockTransactions[1];
      const avgAmount = (1200 + 500 + 510) / 3; // user_1 transactions: 743.3333
      const amountDev = Math.abs(500 - avgAmount) / avgAmount; // ~0.32735
      const result = detectAnomalies(transaction, mockTransactions);
      expect(result).toBeCloseTo(amountDev * 0.3, 2); // ~0.098205
    });

    it("handles empty transaction list", () => {
      const transaction = mockTransactions[0];
      expect(() => detectAnomalies(transaction, [])).toThrow(); // Division by zero
    });

    it("throws error for undefined amount or userId", () => {
      const transaction: Transaction = {
        ...mockTransactions[0],
        amount: undefined,
        userId: undefined,
      } as any;
      expect(() => detectAnomalies(transaction, mockTransactions)).toThrow(
        "Transaction amount and userId are required"
      );
    });

    it("handles missing location", () => {
      const transaction = { ...mockTransactions[0], location: undefined };
      const avgAmount = (1200 + 500 + 510) / 3;
      const amountDev = Math.abs(1200 - avgAmount) / avgAmount;
      const result = detectAnomalies(transaction, mockTransactions);
      expect(result).toBeCloseTo(amountDev * 0.3, 2);
    });
  });
});