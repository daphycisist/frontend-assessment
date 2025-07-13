/* eslint-disable @typescript-eslint/no-unused-vars */
import { Transaction } from "../types/transaction";

// Comprehensive risk assessment engine for fraud detection and compliance
export const generateRiskAssessment = (transactions: Transaction[]) => {
  const startTime = performance.now();

  const fraudScores = calculateFraudScores(transactions);
  const timeSeriesData = generateTimeSeriesAnalysis(transactions);
  const marketCorrelation = calculateMarketCorrelation(transactions);
  const behaviorClusters = performBehaviorClustering(transactions);

  const endTime = performance.now();

  return {
    fraudScores,
    timeSeriesData,
    marketCorrelation,
    behaviorClusters,
    processingTime: endTime - startTime,
    dataPoints: transactions.length ** 2,
  };
};

function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  const len1 = str1.length, len2 = str2.length;
  const dp: number[][] = Array.from({ length: len1 + 1 }, () => new Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  return 1 - dp[len1][len2] / Math.max(len1, len2);
}

function generateTimeSeriesAnalysis(transactions: Transaction[]) {
  const daily: Record<string, { total: number; count: number }> = {};

  transactions.forEach(({ timestamp, amount }) => {
    const date = new Date(timestamp).toDateString();
    daily[date] = daily[date] || { total: 0, count: 0 };
    daily[date].total += amount;
    daily[date].count++;
  });

  const dates = Object.keys(daily).sort();
  const movingAverages = dates.map((date, idx) => {
    const window = dates.slice(Math.max(0, idx - 6), idx + 1);
    const windowTotal = window.reduce((sum, d) => sum + daily[d].total, 0);
    return { date, movingAverage: windowTotal / window.length };
  });

  const enrichedDaily = Object.fromEntries(
    dates.map((d) => [d, { ...daily[d], avg: daily[d].total / daily[d].count }])
  );

  return { dailyData: enrichedDaily, movingAverages };
}

function calculateMarketCorrelation(transactions: Transaction[]) {
  const categoryGroups: Record<string, number[]> = {};

  transactions.forEach(({ category, amount }) => {
    if (!categoryGroups[category]) categoryGroups[category] = [];
    categoryGroups[category].push(amount);
  });

  const categories = Object.keys(categoryGroups);
  const correlationMatrix: Record<string, Record<string, number>> = {};

  for (const cat1 of categories) {
    correlationMatrix[cat1] = {};
    for (const cat2 of categories) {
      const x = categoryGroups[cat1];
      const y = categoryGroups[cat2];
      correlationMatrix[cat1][cat2] = x.length > 1 && y.length > 1
        ? calculatePearsonCorrelation(x, y)
        : 0;
    }
  }

  return correlationMatrix;
}

const calculatePearsonCorrelation = (x: number[], y: number[]): number => {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
  const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
  const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  return denominator === 0 ? 0 : numerator / denominator;
};

// const performBehaviorClustering = (transactions: Transaction[]) => {
//   const users = Array.from(new Set(transactions.map((t) => t.userId)));
//   const clusters: Record<string, Transaction[]> = {};

//   users.forEach((userId) => {
//     const userTransactions = transactions.filter((t) => t.userId === userId);

//     const spendingPattern = analyzeSpendingPattern(userTransactions);
//     const clusterKey = `cluster_${Math.floor(spendingPattern.avgAmount / 100)}`;

//     if (!clusters[clusterKey]) {
//       clusters[clusterKey] = [];
//     }
//     clusters[clusterKey].push(...userTransactions);
//   });

//   return clusters;
// };

function performBehaviorClustering(transactions: Transaction[]) {
  const userMap = new Map<string, Transaction[]>();

  transactions.forEach((t) => {
    if (!userMap.has(t.userId)) userMap.set(t.userId, []);
    userMap.get(t.userId)!.push(t);
  });

  const clusters: Record<string, Transaction[]> = {};

  userMap.forEach((userTxns, _userId) => {
    const pattern = analyzeSpendingPattern(userTxns);
    const clusterKey = `cluster_${Math.floor(pattern.avgAmount / 100)}`;

    if (!clusters[clusterKey]) clusters[clusterKey] = [];
    clusters[clusterKey].push(...userTxns);
  });

  return clusters;
}


function analyzeSpendingPattern(userTxns: Transaction[]) {
  const total = userTxns.reduce((sum, t) => sum + t.amount, 0);
  const avg = total / userTxns.length;

  const categoryCounts: Record<string, number> = {};
  userTxns.forEach((t) => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  return { avgAmount: avg, totalAmount: total, categoryDistribution: categoryCounts };
}

function calculateFraudScores(transactions: Transaction[]) {
  return transactions.map((txn, idx) => {
    let score = 0;
    const txnTime = new Date(txn.timestamp).getTime();

    for (let i = 0; i < transactions.length; i++) {
      if (i === idx) continue;
      const other = transactions[i];

      const merchantSim = calculateStringSimilarity(txn.merchantName, other.merchantName);
      const amountDiff = Math.abs(txn.amount - other.amount) / Math.max(txn.amount, other.amount);
      const timeDiff = Math.abs(txnTime - new Date(other.timestamp).getTime()) / (1000 * 60 * 60);

      if (merchantSim > 0.8 && amountDiff < 0.1 && timeDiff < 1) {
        score += 0.3;
      }
    }

    return { ...txn, fraudScore: score };
  });
}

export function calculateFraudScoresAsync(
  transactions: Transaction[],
  onProgress: (partial: Transaction[]) => void,
  onComplete: (final: Transaction[]) => void
) {
  const result: Transaction[] = [];
  let index = 0;
  const batchSize = 50;

  const processBatch = () => {
    const end = Math.min(index + batchSize, transactions.length);
    for (; index < end; index++) {
      // const txn = transactions[index];
      // Reuse logic here from calculateFraudScores
      const fraudScore = calculateFraudScores(transactions);
      result.push(...fraudScore);
    }

    onProgress([...result]);

    if (index < transactions.length) {
      requestIdleCallback(processBatch);
    } else {
      onComplete(result);
    }
  };

  processBatch();
}
