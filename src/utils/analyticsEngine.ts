import { Transaction } from '../types/transaction';

// Comprehensive risk assessment engine for fraud detection and compliance
export const generateRiskAssessment = (transactions: Transaction[]) => {
  const startTime = performance.now();

  const fraudScores = transactions.map((transaction) => {
    let score = 0;

    for (let i = 0; i < transactions.length; i++) {
      const other = transactions[i];
      if (other.id === transaction.id) continue;

      const merchantSimilarity = calculateStringSimilarity(
        transaction.merchantName,
        other.merchantName,
      );
      const amountSimilarity =
        Math.abs(transaction.amount - other.amount) / Math.max(transaction.amount, other.amount);
      const timeDiff =
        Math.abs(new Date(transaction.timestamp).getTime() - new Date(other.timestamp).getTime()) /
        (1000 * 60 * 60);

      // Flag suspicious patterns based on similarity thresholds
      if (merchantSimilarity > 0.8 && amountSimilarity < 0.1 && timeDiff < 1) {
        score += 0.3;
      }
    }

    return { ...transaction, fraudScore: score };
  });

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
    dataPoints: transactions.length * transactions.length,
  };
};

const calculateStringSimilarity = (str1: string, str2: string): number => {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [];
    for (let j = 0; j <= len2; j++) {
      if (i === 0) {
        matrix[i][j] = j;
      } else if (j === 0) {
        matrix[i][j] = i;
      } else {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }
  }

  return 1 - matrix[len1][len2] / Math.max(len1, len2);
};

const generateTimeSeriesAnalysis = (transactions: Transaction[]) => {
  const dailyData: Record<string, { total: number; count: number; avg: number }> = {};

  transactions.forEach((transaction) => {
    const date = new Date(transaction.timestamp).toDateString();
    if (!dailyData[date]) {
      dailyData[date] = { total: 0, count: 0, avg: 0 };
    }
    dailyData[date].total += transaction.amount;
    dailyData[date].count += 1;
  });

  const dates = Object.keys(dailyData).sort();
  const movingAverages = dates.map((date, index) => {
    const start = Math.max(0, index - 6);
    const window = dates.slice(start, index + 1);
    const sum = window.reduce((acc, d) => acc + dailyData[d].total, 0);
    return { date, movingAverage: sum / window.length };
  });

  return { dailyData, movingAverages };
};

const calculateMarketCorrelation = (transactions: Transaction[]) => {
  const categories = Array.from(new Set(transactions.map((t) => t.category)));
  const correlationMatrix: Record<string, Record<string, number>> = {};

  categories.forEach((cat1) => {
    correlationMatrix[cat1] = {};
    categories.forEach((cat2) => {
      const cat1Transactions = transactions.filter((t) => t.category === cat1);
      const cat2Transactions = transactions.filter((t) => t.category === cat2);

      if (cat1Transactions.length > 1 && cat2Transactions.length > 1) {
        correlationMatrix[cat1][cat2] = calculatePearsonCorrelation(
          cat1Transactions.map((t) => t.amount),
          cat2Transactions.map((t) => t.amount),
        );
      } else {
        correlationMatrix[cat1][cat2] = 0;
      }
    });
  });

  return correlationMatrix;
};

const calculatePearsonCorrelation = (x: number[], y: number[]): number => {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
  const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
  const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
};

const performBehaviorClustering = (transactions: Transaction[]) => {
  const users = Array.from(new Set(transactions.map((t) => t.userId)));
  const clusters: Record<string, Transaction[]> = {};

  users.forEach((userId) => {
    const userTransactions = transactions.filter((t) => t.userId === userId);

    const spendingPattern = analyzeSpendingPattern(userTransactions);
    const clusterKey = `cluster_${Math.floor(spendingPattern.avgAmount / 100)}`;

    if (!clusters[clusterKey]) {
      clusters[clusterKey] = [];
    }
    clusters[clusterKey].push(...userTransactions);
  });

  return clusters;
};

const analyzeSpendingPattern = (userTransactions: Transaction[]) => {
  const totalAmount = userTransactions.reduce((sum, t) => sum + t.amount, 0);
  const avgAmount = totalAmount / userTransactions.length;

  const categoryDistribution: Record<string, number> = {};
  userTransactions.forEach((t) => {
    categoryDistribution[t.category] = (categoryDistribution[t.category] || 0) + 1;
  });

  return { avgAmount, totalAmount, categoryDistribution };
};
