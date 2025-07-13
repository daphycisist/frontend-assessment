// __tests__/riskEngine.test.ts
import { generateRiskAssessment } from "../src/utils/analyticsEngine";
import { Transaction } from "../src/types/transaction";

const mockTransactions: Transaction[] = [
  {
    id: "txn_1",
    amount: 100,
    timestamp: new Date("2025-07-01T12:00:00Z"),
    currency: "USD",
    type: "debit",
    category: "Food & Dining",
    description: "Lunch at Starbucks",
    merchantName: "Starbucks",
    status: "completed",
    userId: "user_1",
    accountId: "acc_1",
    location: "New York, NY",
    reference: "REF001",
  },
  {
    id: "txn_2",
    amount: 105,
    timestamp: new Date("2025-07-01T12:30:00Z"),
    currency: "USD",
    type: "debit",
    category: "Food & Dining",
    description: "Coffee at Starbucks",
    merchantName: "Starbucks",
    status: "completed",
    userId: "user_1",
    accountId: "acc_1",
    location: "New York, NY",
    reference: "REF002",
  },
  {
    id: "txn_3",
    amount: 200,
    timestamp: new Date("2025-07-01T15:00:00Z"),
    currency: "USD",
    type: "credit",
    category: "Salary",
    description: "Monthly salary",
    merchantName: "Company Inc",
    status: "completed",
    userId: "user_2",
    accountId: "acc_2",
    location: "Los Angeles, CA",
    reference: "REF003",
  },
];

describe("generateRiskAssessment", () => {
  const result = generateRiskAssessment(mockTransactions);

  test("should return fraudScores for each transaction", () => {
    expect(result.fraudScores).toHaveLength(mockTransactions.length);
    result.fraudScores.forEach((txn) => {
      expect(txn).toHaveProperty("fraudScore");
      expect(typeof txn.fraudScore).toBe("number");
    });
  });

  test("should generate timeSeriesData", () => {
    expect(result.timeSeriesData.dailyData).toBeDefined();
    const dates = Object.keys(result.timeSeriesData.dailyData);
    expect(dates.length).toBeGreaterThan(0);
    expect(result.timeSeriesData.movingAverages.length).toBeGreaterThan(0);
  });

  test("should calculate marketCorrelation matrix", () => {
    expect(result.marketCorrelation).toBeDefined();
    const categories = Object.keys(result.marketCorrelation);
    expect(categories.length).toBeGreaterThan(0);
    categories.forEach((cat1) => {
      const row = result.marketCorrelation[cat1];
      expect(typeof row).toBe("object");
      Object.values(row).forEach((value) => {
        expect(typeof value).toBe("number");
      });
    });
  });

  test("should perform behaviorClustering by userId", () => {
    expect(result.behaviorClusters).toBeDefined();
    const clusters = Object.values(result.behaviorClusters);
    expect(clusters.flat().length).toBeGreaterThan(0);
    expect(clusters.flat().every((txn) => txn.userId)).toBe(true);
  });

  test("should return processing time and dataPoints", () => {
    expect(typeof result.processingTime).toBe("number");
    expect(typeof result.dataPoints).toBe("number");
    expect(result.dataPoints).toBe(mockTransactions.length ** 2);
  });
});
