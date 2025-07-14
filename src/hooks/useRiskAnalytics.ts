// hooks/useRiskAnalytics.ts
import { useCallback } from "react";
import {
  calculateRiskFactors,
  analyzeTransactionPatterns,
  detectAnomalies,
} from "../utils/riskUtils";
import { RiskAnalytics, Transaction } from "../types/transaction";

// Throttle Expensive Tasks like runAdvancedAnalytics - Slightly reduced delay and early return for light datasets.
export const useRiskAnalytics = (
  transactions: Transaction[],
  setRiskAnalytics: (data: RiskAnalytics | null) => void,
  setIsAnalyzing: (v: boolean) => void
) => {
  const runAdvancedAnalytics = useCallback(() => {
    if (transactions.length < 100) return;

    setIsAnalyzing(true);

    const analytics = {
      totalRisk: 0,
      highRiskTransactions: 0,
      patterns: {} as Record<string, number>,
      anomalies: {} as Record<string, number>,
      generatedAt: Date.now(),
    };

    for (const tx of transactions) {
      const risk = calculateRiskFactors(tx, transactions);
      const pattern = analyzeTransactionPatterns(tx, transactions);
      const anomaly = detectAnomalies(tx, transactions);

      analytics.totalRisk += risk;
      if (risk > 0.7) analytics.highRiskTransactions++;
      analytics.patterns[tx.id!] = pattern;
      analytics.anomalies[tx.id!] = anomaly;
    }

    const timeout = setTimeout(() => {
      setRiskAnalytics(analytics);
      setIsAnalyzing(false);
    }, 1500);

    return () => clearTimeout(timeout);
  }, [transactions, setIsAnalyzing, setRiskAnalytics]);

  return { runAdvancedAnalytics };
};
