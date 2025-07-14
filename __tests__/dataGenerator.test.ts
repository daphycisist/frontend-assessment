// __tests__/dataGenerator.test.ts
import {
  generateTransactionData,
  searchTransactions,
  filterTransactions,
  calculateSummary,
  getGlobalAnalytics,
  startDataRefresh,
  stopDataRefresh,
} from "../src/utils/dataGenerator";

describe("Data Generator Utilities", () => {
  const sampleTransactions = generateTransactionData(50);

  test("generateTransactionData creates correct number of transactions", () => {
    expect(sampleTransactions.length).toBe(50);
    expect(sampleTransactions[0]).toHaveProperty("id");
    expect(sampleTransactions[0]).toHaveProperty("timestamp");
    expect(sampleTransactions[0]).toHaveProperty("amount");
  });

  test("searchTransactions filters by merchant name", () => {
    const knownMerchant = sampleTransactions[0].merchantName.slice(0, 3).toLowerCase();
    const result = searchTransactions(sampleTransactions, knownMerchant);
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(t => t.merchantName.toLowerCase().includes(knownMerchant))).toBe(true);
  });

  test("filterTransactions filters by type and category", () => {
    const type = "credit";
    const category = sampleTransactions[0].category;
    const result = filterTransactions(sampleTransactions, { type, category });
    expect(result.every(t => t.type === type && t.category === category)).toBe(true);
  });

  test("calculateSummary returns valid summary object", () => {
    const summary = calculateSummary(sampleTransactions);
    expect(summary.totalTransactions).toBe(sampleTransactions.length);
    expect(summary.totalAmount).toBeGreaterThan(0);
    expect(Object.keys(summary.categoryCounts).length).toBeGreaterThan(0);
  });

  test("getGlobalAnalytics returns valid data", () => {
    const analytics = getGlobalAnalytics();
    expect(analytics.totalCachedTransactions).toBeGreaterThan(0);
    expect(analytics.snapshotCount).toBeGreaterThanOrEqual(1);
  });

  test("startDataRefresh and stopDataRefresh work", () => {
    const callback = jest.fn();
    const id = startDataRefresh(callback);
    expect(typeof id).toBe("number");

    stopDataRefresh(id);
  });
});
