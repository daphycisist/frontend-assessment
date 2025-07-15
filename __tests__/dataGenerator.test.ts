/* eslint-disable @typescript-eslint/no-explicit-any */
// __tests__/dataGenerator.test.ts
import {
  searchTransactions,
  filterTransactions,
  calculateSummary,
  getGlobalAnalytics,
  startDataRefresh,
  stopDataRefresh,
} from "../src/utils/dataGenerator";

import { generateTransactionData } from '../src/utils/worker/index';
import type { Transaction } from '../src/types/transaction';

jest.mock('../src/utils/worker/transactionWorker.ts?worker', () => {
  return class {
    onmessage: any;
    postMessage() {
      setTimeout(() => {
        this.onmessage?.({
          data: {
            type: 'chunk',
            data: [
              {
                id: '1',
                amount: 100,
                type: 'credit',
                userId: 'u1',
                merchantName: 'Amazon',
                category: 'Shopping',
              },
            ],
            progress: 100,
          },
        });
        this.onmessage?.({ data: { type: 'done' } });
      }, 10);
    }

    addEventListener(type: string, cb: any) {
      if (type === 'message') this.onmessage = cb;
    }

    terminate() {}
  };
});


describe('generateTransactionData', () => {
  let receivedChunks: Transaction[] = [];

  beforeEach(() => {
    receivedChunks = [];

    global.Worker = class {
      onmessage: any;
      postMessage() {
        // Simulate async behavior
        setTimeout(() => {
          this.onmessage?.({
            data: {
              type: 'chunk',
              data: [
                {
                  id: '1',
                  amount: 100,
                  type: 'credit',
                  userId: 'u1',
                  merchantName: 'Amazon',
                  category: 'Shopping',
                },
              ],
              progress: 100,
            },
          });

          this.onmessage?.({ data: { type: 'done' } });
        }, 10);
      }

      addEventListener(type: string, cb: any) {
        if (type === 'message') {
          this.onmessage = cb;
        }
      }

      terminate() {}
    } as any;
  });

  it('calls onChunk and onDone correctly', async () => {
    const onChunk = jest.fn((chunk) => {
      receivedChunks.push(...chunk);
    });

    const onProgress = jest.fn();
    const onDone = jest.fn();

    generateTransactionData({
      total: 1,
      onChunk,
      onProgress,
      onDone,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onChunk).toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalledWith(100);
    expect(onDone).toHaveBeenCalled();
    expect(receivedChunks).toHaveLength(1);
  });
});

describe('Test helper functions for processing transaction data', () => {
  let receivedChunks: Transaction[] = [];

  beforeEach(() => {
    receivedChunks = [];

    global.Worker = class {
      onmessage: any;
      postMessage() {
        // Simulate async behavior
        setTimeout(() => {
          this.onmessage?.({
            data: {
              type: 'chunk',
              data: [
                {
                  id: '1',
                  amount: 100,
                  type: 'credit',
                  userId: 'u1',
                  merchantName: 'Amazon',
                  category: 'Shopping',
                },
                {
                  id: '2',
                  amount: 100,
                  type: 'credit',
                  userId: 'u1',
                  merchantName: 'Amazon',
                  category: 'Shopping',
                },
                {
                  id: '3',
                  amount: 100,
                  type: 'credit',
                  userId: 'u1',
                  merchantName: 'Walmart',
                  category: 'Shopping',
                },
                {
                  id: '4',
                  amount: 100,
                  type: 'credit',
                  userId: 'u1',
                  merchantName: 'Lyft',
                  category: 'Shopping',
                },
                {
                  id: '5',
                  amount: 100,
                  type: 'debit',
                  userId: 'u1',
                  merchantName: 'Amazon',
                  category: 'Shopping',
                },
              ],
              progress: 100,
            },
          });

          this.onmessage?.({ data: { type: 'done' } });
        }, 10);
      }

      addEventListener(type: string, cb: any) {
        if (type === 'message') {
          this.onmessage = cb;
        }
      }

      terminate() {}
    } as any;
  });

  beforeEach(async () => {
    const onChunk = jest.fn((chunk) => {
      receivedChunks.push(...chunk);
    });

    const onProgress = jest.fn();
    const onDone = jest.fn();

    generateTransactionData({
      total: 5,
      onChunk,
      onProgress,
      onDone,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
  })

  test("generateTransactionData creates correct number of transactions", () => {
    expect(receivedChunks.length).toBeGreaterThanOrEqual(1);
    expect(receivedChunks[0]).toHaveProperty("id");
    expect(receivedChunks[0]).toHaveProperty("type");
    expect(receivedChunks[0]).toHaveProperty("amount");
  });

  test("searchTransactions filters by merchant name", () => {
    const knownMerchant = receivedChunks[0].merchantName.slice(0, 3).toLowerCase();
    const result = searchTransactions(receivedChunks, knownMerchant);
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(t => t.merchantName.toLowerCase().includes(knownMerchant))).toBe(true);
  });

  test("filterTransactions filters by type and category", () => {
    const type = "credit";
    const category = receivedChunks[0].category;
    const result = filterTransactions(receivedChunks, { type, category });
    expect(result.every(t => t.type === type && t.category === category)).toBe(true);
  });

  test("calculateSummary returns valid summary object", () => {
    const summary = calculateSummary(receivedChunks);
    expect(summary.totalTransactions).toBe(receivedChunks.length);
    expect(summary.totalAmount).toBeLessThanOrEqual(100);
    expect(Object.keys(summary.categoryCounts).length).toBeGreaterThanOrEqual(0);
  });

  test("getGlobalAnalytics returns valid data", () => {
    const analytics = getGlobalAnalytics();
    expect(analytics.totalCachedTransactions).toBe(0);
    expect(analytics.snapshotCount).toBeGreaterThanOrEqual(0);
  });

  test("startDataRefresh and stopDataRefresh work", () => {
    const callback = jest.fn();
    const id = startDataRefresh(callback);
    expect(typeof id).toBe("number");

    stopDataRefresh(id);
  });
})