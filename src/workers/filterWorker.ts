import { Transaction, FilterOptions } from '../types/transaction';
import { analyzeTransactionPatterns, calculateRiskFactors, detectAnomalies, filterTransactions, searchTransactions } from '../utils';

// Main filter processing function
const applyFilters = async (
  data: Transaction[],
  currentFilters: FilterOptions,
  userPreferences: any
) => {
  try {
    let filtered = [...data];

    if (currentFilters.searchTerm && currentFilters.searchTerm.length > 0) {
      filtered = await searchTransactions(filtered, currentFilters.searchTerm);
    }

    if (currentFilters.type && currentFilters.type !== "all") {
      filtered = await filterTransactions(filtered, { type: currentFilters.type });
    }

    if (currentFilters.status && currentFilters.status !== "all") {
      filtered = await filterTransactions(filtered, {
        status: currentFilters.status,
      });
    }

    if (currentFilters.category) {
      filtered = await filterTransactions(filtered, {
        category: currentFilters.category,
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
  } catch (error) {
    throw new Error(`Filter processing failed: ${error}`);
  }
};

// Web Worker message handler
self.onmessage = async (event) => {
  const { type, data, filters, userPreferences, id } = event.data;

  try {
    if (type === 'APPLY_FILTERS') {
      const result = await applyFilters(data, filters, userPreferences);
      
      self.postMessage({
        type: 'FILTER_RESULT',
        result,
        id,
        success: true
      });
    }
  } catch (error) {
    self.postMessage({
      type: 'FILTER_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      id,
      success: false
    });
  }
};

export {};
