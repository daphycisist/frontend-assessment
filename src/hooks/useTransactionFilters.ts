// hooks/useTransactionFilters.ts
import { useCallback } from "react";
import { searchTransactions, filterTransactions } from "../utils/dataGenerator";
import {
  calculateRiskFactors,
  analyzeTransactionPatterns,
  detectAnomalies,
} from "../utils/riskUtils";
import { FilterKeys, FilterOptions, Transaction, UserPreferences } from "../types/transaction";

// Optimize applyFilters with less nesting and map logic split: Flatten logic, support dynamic filter keys, reduce repeated conditionals.
export const useTransactionFilters = (
  userPreferences: UserPreferences,
  setUserPreferences: (updater: (prev: UserPreferences) => UserPreferences) => void,
  setFilteredTransactions: (txs: Transaction[]) => void
) => {
  const applyFilters = useCallback(
    (data: Transaction[], filters: FilterOptions, search: string) => {
      let filtered = [...data];

      if (search) {
        filtered = searchTransactions(filtered, search);
      }

      (['type', 'status', 'category'] as FilterKeys[]).forEach((key) => {
        const value = filters[key];
        if (value && value !== "all") {
          filtered = filterTransactions(filtered, { [key]: value });
        }
      });

      if (userPreferences.compactView) {
        filtered = filtered.slice(0, userPreferences.itemsPerPage);
      }

      if (filtered.length > 1000) {
        filtered = filtered.map((transaction) => {
          const risk = calculateRiskFactors(transaction, filtered);
          const pattern = analyzeTransactionPatterns(transaction, filtered);
          const anomaly = detectAnomalies(transaction, filtered);

          return {
            ...transaction,
            riskScore: risk + pattern + anomaly,
            enrichedData: {
              risk,
              pattern,
              anomaly,
              timestamp: Date.now(),
            },
          };
        });
      }

      setFilteredTransactions(filtered);
      setUserPreferences((prev) => ({
        ...prev,
        timestamps: { ...prev.timestamps, updated: Date.now() },
      }));
    },
    [userPreferences.compactView, userPreferences.itemsPerPage, setFilteredTransactions, setUserPreferences]
  );

  return { applyFilters };
};
