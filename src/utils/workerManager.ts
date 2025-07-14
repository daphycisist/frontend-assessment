import { Transaction, FilterOptions } from '../types/transaction';

// Worker manager for handling web worker communication
class WorkerManager {
  private filterWorker: Worker | null = null;
  private dataGeneratorWorker: Worker | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    type: string;
  }>();

  constructor() {
    this.initializeWorkers();
  }

  private initializeWorkers() {
    try {
      // Initialize filter worker
      this.filterWorker = new Worker(
        new URL('../workers/filterWorker.ts', import.meta.url),
        { type: 'module' }
      );

      this.filterWorker.onmessage = (event) => {
        this.handleWorkerMessage(event, 'filter');
      };

      this.filterWorker.onerror = (error) => {
        console.error('Filter worker error:', error);
        this.handleWorkerError(error, 'filter');
      };

      // Initialize data generator worker
      this.dataGeneratorWorker = new Worker(
        new URL('../workers/dataGeneratorWorker.ts', import.meta.url),
        { type: 'module' }
      );

      this.dataGeneratorWorker.onmessage = (event) => {
        this.handleWorkerMessage(event, 'dataGenerator');
      };

      this.dataGeneratorWorker.onerror = (error) => {
        console.error('Data generator worker error:', error);
        this.handleWorkerError(error, 'dataGenerator');
      };

    } catch (error) {
      console.error('Failed to initialize workers:', error);
      // Fallback: workers not supported
    }
  }

  private handleWorkerMessage(event: MessageEvent, _workerType: string) {
    const { type, result, error, id, success, progress, generated, total, processingTime, count } = event.data;

    if (type === 'GENERATION_PROGRESS') {
      // Handle progress updates for data generation
      this.onProgressUpdate?.(progress, generated, total);
      return;
    }

    const request = this.pendingRequests.get(id);
    if (!request) return;

    this.pendingRequests.delete(id);

    if (success) {
      if (type === 'FILTER_RESULT') {
        request.resolve(result);
      } else if (type === 'GENERATION_RESULT') {
        request.resolve({
          transactions: result,
          processingTime,
          count
        });
      }
    } else {
      request.reject(new Error(error));
    }
  }

  private handleWorkerError(error: ErrorEvent, workerType: string) {
    console.error(`${workerType} worker error:`, error);
    
    // Reject all pending requests for this worker
    this.pendingRequests.forEach((request, id) => {
      if (
        (workerType === 'filter' && request.type.startsWith('FILTER')) ||
        (workerType === 'dataGenerator' && request.type.startsWith('GENERATION'))
      ) {
        request.reject(new Error(`${workerType} worker failed: ${error.message}`));
        this.pendingRequests.delete(id);
      }
    });
  }

  // Progress callback for data generation
  public onProgressUpdate?: (progress: number, generated: number, total: number) => void;

  // Apply filters using web worker
  public async applyFilters(
    data: Transaction[],
    filters: FilterOptions,
    userPreferences: any
  ): Promise<Transaction[]> {
    if (!this.filterWorker) {
      throw new Error('Filter worker not available');
    }

    const id = ++this.requestId;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, {
        resolve,
        reject,
        type: 'FILTER_RESULT'
      });

      this.filterWorker!.postMessage({
        type: 'APPLY_FILTERS',
        data,
        filters,
        userPreferences,
        id
      });

      // Set timeout for long-running operations
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Filter operation timed out'));
        }
      }, 30000); // 30 second timeout
    });
  }

  // Generate transaction data using web worker
  public async generateTransactionData(count: number): Promise<{
    transactions: Transaction[];
    processingTime: number;
    count: number;
  }> {
    if (!this.dataGeneratorWorker) {
      throw new Error('Data generator worker not available');
    }

    const id = ++this.requestId;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, {
        resolve,
        reject,
        type: 'GENERATION_RESULT'
      });

      this.dataGeneratorWorker!.postMessage({
        type: 'GENERATE_TRANSACTIONS',
        count,
        id
      });

      // Set timeout for long-running operations
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Data generation timed out'));
        }
      }, 60000); // 60 second timeout for large datasets
    });
  }

  // Check if workers are available
  public get isWorkerSupported(): boolean {
    return !!(this.filterWorker && this.dataGeneratorWorker);
  }

  // Terminate workers
  public terminate() {
    if (this.filterWorker) {
      this.filterWorker.terminate();
      this.filterWorker = null;
    }

    if (this.dataGeneratorWorker) {
      this.dataGeneratorWorker.terminate();
      this.dataGeneratorWorker = null;
    }

    // Reject all pending requests
    this.pendingRequests.forEach((request) => {
      request.reject(new Error('Worker terminated'));
    });
    this.pendingRequests.clear();
  }
}

// Singleton instance
export const workerManager = new WorkerManager();

// Fallback functions for when workers are not available
export const fallbackApplyFilters = async (
  data: Transaction[],
  filters: FilterOptions,
  userPreferences: any
): Promise<Transaction[]> => {
  // Import the original functions dynamically
  const { searchTransactions, filterTransactions } = await import('./dataGenerator');
  const { calculateRiskFactors, analyzeTransactionPatterns, detectAnomalies } = await import('./analyticsEngine');

  let filtered = [...data];

  if (filters.searchTerm && filters.searchTerm.length > 0) {
    filtered = await searchTransactions(filtered, filters.searchTerm);
  }

  if (filters.type && filters.type !== "all") {
    filtered = await filterTransactions(filtered, { type: filters.type });
  }

  if (filters.status && filters.status !== "all") {
    filtered = await filterTransactions(filtered, {
      status: filters.status,
    });
  }

  if (filters.category) {
    filtered = await filterTransactions(filtered, {
      category: filters.category,
    });
  }

  if (userPreferences.compactView) {
    filtered = filtered.slice(0, userPreferences.itemsPerPage);
  }

  // Enhanced fraud analysis for large datasets
  if (filtered.length > 1000) {
    const enrichedFiltered = filtered.map((transaction) => {
      const riskFactors = calculateRiskFactors(transaction, filtered);
      const patternScore = analyzeTransactionPatterns(transaction, filtered);
      const anomalyDetection = detectAnomalies(transaction, filtered);

      return {
        ...transaction,
        riskScore: riskFactors + patternScore + anomalyDetection,
        enrichedData: {
          riskFactors,
          patternScore,
          anomalyDetection,
          timestamp: Date.now(),
        },
      };
    });

    return enrichedFiltered;
  } else {
    return filtered;
  }
};

export const fallbackGenerateTransactionData = async (count: number): Promise<{
  transactions: Transaction[];
  processingTime: number;
  count: number;
}> => {
  const startTime = performance.now();
  const { generateTransactionData } = await import('./dataGenerator');
  const transactions = await generateTransactionData(count);
  const endTime = performance.now();

  return {
    transactions,
    processingTime: endTime - startTime,
    count: transactions.length
  };
};
