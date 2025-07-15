// hooks/useRiskAnalytics.ts
import { useCallback } from "react";
import {
  calculateRiskFactors,
  analyzeTransactionPatterns,
  detectAnomalies,
} from "../utils/riskUtils";
import { RiskAnalytics, Transaction } from "../types/transaction";

const CHUNK_SIZE = 250;

export const useRiskAnalytics = (
  transactions: Transaction[],
  setRiskAnalytics: (data: RiskAnalytics | null) => void,
  setIsAnalyzing: (v: boolean) => void
) => {
  const runAdvancedAnalytics = useCallback(() => {
    if (transactions.length < 100) return;

    setIsAnalyzing(true);

    let currentIndex = 0;
    const total = transactions.length;

    const analytics = {
      totalRisk: 0,
      highRiskTransactions: 0,
      patterns: {} as Record<string, number>,
      anomalies: {} as Record<string, number>,
      generatedAt: Date.now(),
    };

    const processChunk = () => {
      const end = Math.min(currentIndex + CHUNK_SIZE, total);

      for (let i = currentIndex; i < end; i++) {
        const tx = transactions[i];
        const risk = calculateRiskFactors(tx, transactions);
        const pattern = analyzeTransactionPatterns(tx, transactions);
        const anomaly = detectAnomalies(tx, transactions);

        analytics.totalRisk += risk;
        if (risk > 0.7) analytics.highRiskTransactions++;
        analytics.patterns[tx.id!] = pattern;
        analytics.anomalies[tx.id!] = anomaly;
      }

      currentIndex = end;

      if (currentIndex < total) {
        requestIdleCallback(processChunk, { timeout: 100 });
      } else {
        setRiskAnalytics(analytics);
        setIsAnalyzing(false);
      }
    };

    requestIdleCallback(processChunk, { timeout: 100 });
  }, [transactions, setIsAnalyzing, setRiskAnalytics]);

  return { runAdvancedAnalytics };
};
