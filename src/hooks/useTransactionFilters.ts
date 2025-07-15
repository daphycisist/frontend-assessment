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
      let filtered = data;

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
        const enriched = new Array(filtered.length);
        for (let i = 0; i < filtered.length; i++) {
          const tx = filtered[i];
          const risk = calculateRiskFactors(tx, filtered);
          const pattern = analyzeTransactionPatterns(tx, filtered);
          const anomaly = detectAnomalies(tx, filtered);

          enriched[i] = {
            ...tx,
            riskScore: risk + pattern + anomaly,
            enrichedData: {
              risk,
              pattern,
              anomaly,
              timestamp: Date.now(),
            },
          };
        }
        filtered = enriched;
      }

      setFilteredTransactions(filtered);
      setUserPreferences((prev) => ({
        ...prev,
        timestamps: { ...prev.timestamps, updated: Date.now() },
      }));

      return filtered;
    },
    [
      userPreferences.compactView,
      userPreferences.itemsPerPage,
      setFilteredTransactions,
      setUserPreferences,
    ]
  );

  return { applyFilters };
};
