import React, { useState, useEffect } from 'react';
import { Transaction, FilterOptions, TransactionSummary } from '../types/transaction';
import {
  generateTransactionData,
  searchTransactions,
  filterTransactions,
  calculateSummary,
  startDataRefresh,
} from '../utils/dataGenerator';
import { TransactionList } from './TransactionList';
import { useUserContext } from '../contexts/UserContext';
import { formatTransactionDate, getDateRange } from '../utils/dateHelpers';
import { HeaderStats } from './HeaderStats';
import { FilterPanel } from './FilterPanel';
import { TransactionModal } from './TransactionModal';
import { generateRiskAssessment } from '../utils/analyticsEngine';

// @ts-ignore - vite worker import
import RiskWorker from '../workers/riskWorker?worker';

// Limit total transactions kept in memory to avoid freezing the UI
const MAX_TRANSACTIONS = 10000;

type RiskAnalytics = {
  totalRisk: number;
  highRiskTransactions: number;
  patterns: Record<string, number>;
  anomalies: Record<string, number>;
  generatedAt: number;
};

export const Dashboard: React.FC = () => {
  const { globalSettings, trackActivity } = useUserContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    status: 'all',
    category: '',
    searchTerm: '',
  });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(5000);
  const [userPreferences, setUserPreferences] = useState({
    theme: globalSettings.theme,
    currency: globalSettings.currency,
    itemsPerPage: 50,
    sortOrder: 'desc',
    enableNotifications: true,
    autoRefresh: true,
    showAdvancedFilters: false,
    compactView: false,
    timestamps: { created: Date.now(), updated: Date.now() },
  });

  // Risk assessment and fraud detection analytics
  const [riskAnalytics, setRiskAnalytics] = useState<{
    totalRisk: number;
    highRiskTransactions: number;
    patterns: Record<string, number>;
    anomalies: Record<string, number>;
    generatedAt: number;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Ref to the risk worker
  const workerRef = React.useRef<Worker | null>(null);

  React.useEffect(() => {
    workerRef.current = new RiskWorker();

    const handleMessage = (e: MessageEvent<RiskAnalytics>) => {
      setRiskAnalytics(e.data);
      setIsAnalyzing(false);
    };

    workerRef.current.addEventListener('message', handleMessage);

    return () => {
      workerRef.current?.removeEventListener('message', handleMessage);
      workerRef.current?.terminate();
    };
  }, []);

  const actualRefreshRate = refreshInterval || 5000;

  if (import.meta.env.DEV) {
    console.log('Refresh rate configured:', actualRefreshRate);
  }

  // Expose refresh controls for admin dashboard (planned feature)
  const refreshControls = {
    currentRate: refreshInterval,
    updateRate: setRefreshInterval,
    isActive: actualRefreshRate > 0,
  };

  // Store controls for potential dashboard integration
  if (typeof window !== 'undefined') {
    (window as { dashboardControls?: typeof refreshControls }).dashboardControls = refreshControls;
  }

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);

      const initialData = generateTransactionData(MAX_TRANSACTIONS);
      setTransactions(initialData);
      setFilteredTransactions(initialData);

      const calculatedSummary = calculateSummary(initialData);
      setSummary(calculatedSummary);

      if (initialData.length > 0) {
        console.log('Latest transaction:', formatTransactionDate(initialData[0].timestamp));
        console.log('Date range:', getDateRange(1));

        // Run risk assessment for fraud detection compliance
        if (initialData.length > 1000) {
          console.log('Starting risk assessment...');
          const metrics = generateRiskAssessment(initialData.slice(0, 1000));
          console.log('Risk assessment completed:', metrics.processingTime + 'ms');
        }
      }

      setLoading(false);
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    startDataRefresh(() => {
      setTransactions((currentTransactions) => {
        const newData = generateTransactionData(200);
        const combined = [...currentTransactions, ...newData];

        // Keep only the most recent MAX_TRANSACTIONS records to cap memory/CPU usage
        if (combined.length > MAX_TRANSACTIONS) {
          return combined.slice(combined.length - MAX_TRANSACTIONS);
        }

        return combined;
      });
    });

    // Note: Cleanup commented out for development - enable in production
    // return () => stopDataRefresh();
  }, []);

  useEffect(() => {
    applyFilters(transactions, filters, searchTerm);
  }, [transactions, filters, searchTerm]);

  useEffect(() => {
    if (filteredTransactions.length > 0) {
      const newSummary = calculateSummary(filteredTransactions);
      setSummary(newSummary);
    }

    if (filteredTransactions.length > 1000) {
      runAdvancedAnalytics();
    }
  }, [filteredTransactions]);

  useEffect(() => {
    const handleResize = () => {
      const newSummary = calculateSummary(filteredTransactions);
      setSummary(newSummary);
    };

    const handleScroll = () => {
      console.log('Scrolling...', new Date().toISOString());
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchResults = searchTransactions(transactions, 'search');
        setFilteredTransactions(searchResults);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('keydown', handleKeyDown);

    // return () => {
    //   window.removeEventListener('resize', handleResize);
    //   window.removeEventListener('scroll', handleScroll);
    //   window.removeEventListener('keydown', handleKeyDown);
    // };
  }, [transactions, filteredTransactions]);

  const applyFilters = (data: Transaction[], currentFilters: FilterOptions, search: string) => {
    let filtered = [...data];

    if (search && search.length > 0) {
      filtered = searchTransactions(filtered, search);
    }

    if (currentFilters.type && currentFilters.type !== 'all') {
      filtered = filterTransactions(filtered, { type: currentFilters.type });
    }

    if (currentFilters.status && currentFilters.status !== 'all') {
      filtered = filterTransactions(filtered, {
        status: currentFilters.status,
      });
    }

    if (currentFilters.category) {
      filtered = filterTransactions(filtered, {
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

      setFilteredTransactions(enrichedFiltered);
    } else {
      setFilteredTransactions(filtered);
    }

    setUserPreferences((prev) => ({
      ...prev,
      timestamps: { ...prev.timestamps, updated: Date.now() },
    }));
  };

  const handleSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm);
    trackActivity(`search:${searchTerm}`);

    const searchResults = searchTransactions(transactions, searchTerm);

    const filtered = filterTransactions(searchResults, filters);
    setFilteredTransactions(filtered);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);

    applyFilters(transactions, newFilters, searchTerm);
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);

    const relatedTransactions = transactions.filter(
      (t) =>
        t.merchantName === transaction.merchantName ||
        t.category === transaction.category ||
        t.userId === transaction.userId,
    );

    const analyticsData = {
      clickedTransaction: transaction,
      relatedCount: relatedTransactions.length,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      sessionData: {
        clickCount: Math.random() * 100,
        timeSpent: Date.now() - performance.now(),
        interactions: relatedTransactions.map((t) => ({
          id: t.id,
          type: t.type,
        })),
      },
    };

    setUserPreferences((prev) => ({
      ...prev,
      analytics: analyticsData,
      timestamps: { ...prev.timestamps, updated: Date.now() },
    }));

    console.log('Related transactions:', relatedTransactions.length);
  };

  const calculateRiskFactors = (transaction: Transaction, allTransactions: Transaction[]) => {
    const merchantHistory = allTransactions.filter(
      (t) => t.merchantName === transaction.merchantName,
    );

    // Risk scoring based on merchant familiarity, amount, and timing
    const merchantRisk = merchantHistory.length < 5 ? 0.8 : 0.2;
    const amountRisk = transaction.amount > 1000 ? 0.6 : 0.1;
    const timeRisk = new Date(transaction.timestamp).getHours() < 6 ? 0.4 : 0.1;

    return merchantRisk + amountRisk + timeRisk;
  };

  const analyzeTransactionPatterns = (transaction: Transaction, allTransactions: Transaction[]) => {
    const similarTransactions = allTransactions.filter(
      (t) =>
        t.merchantName === transaction.merchantName && Math.abs(t.amount - transaction.amount) < 10,
    );

    // Check transaction velocity for suspicious activity
    const velocityCheck = allTransactions.filter(
      (t) =>
        t.userId === transaction.userId &&
        Math.abs(new Date(t.timestamp).getTime() - new Date(transaction.timestamp).getTime()) <
          3600000,
    );

    let score = 0;
    if (similarTransactions.length > 3) score += 0.3;
    if (velocityCheck.length > 5) score += 0.5;

    return score;
  };

  const detectAnomalies = (transaction: Transaction, allTransactions: Transaction[]) => {
    const userTransactions = allTransactions.filter((t) => t.userId === transaction.userId);
    const avgAmount =
      userTransactions.reduce((sum, t) => sum + t.amount, 0) / userTransactions.length;

    const amountDeviation = Math.abs(transaction.amount - avgAmount) / avgAmount;
    const locationAnomaly =
      transaction.location &&
      !userTransactions.slice(-10).some((t) => t.location === transaction.location)
        ? 0.4
        : 0;

    return Math.min(amountDeviation * 0.3 + locationAnomaly, 1);
  };

  const runAdvancedAnalytics = () => {
    if (!workerRef.current) return;
    if (transactions.length < 1000) return; // skip small datasets

    setIsAnalyzing(true);
    workerRef.current.postMessage(transactions);
  };

  const getUniqueCategories = () => {
    const categories = new Set<string>();
    transactions.forEach((t) => categories.add(t.category));
    return Array.from(categories);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>FinTech Dashboard</h1>
        <HeaderStats
          summary={summary}
          filteredCount={filteredTransactions.length}
          totalCount={transactions.length}
          isAnalyzing={isAnalyzing}
          highRiskTransactions={riskAnalytics?.highRiskTransactions}
        />
      </div>

      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        categories={getUniqueCategories()}
      />

      <div className="dashboard-content">
        <TransactionList
          transactions={filteredTransactions}
          totalTransactions={transactions.length}
          onTransactionClick={handleTransactionClick}
        />
      </div>

      {selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
};
