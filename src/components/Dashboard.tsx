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
import { SearchBar } from './SearchBar';
import { useUserContext } from '../contexts/UserContext';
import { DollarSign, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { formatTransactionDate, getDateRange } from '../utils/dateHelpers';
import { generateRiskAssessment } from '../utils/analyticsEngine';

// Limit total transactions kept in memory to avoid freezing the UI
const MAX_TRANSACTIONS = 10000;

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

    if (filteredTransactions.length > 500) {
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

  const runAdvancedAnalytics = async () => {
    if (transactions.length < 100) return;

    setIsAnalyzing(true);

    const analyticsData = {
      totalRisk: 0,
      highRiskTransactions: 0,
      patterns: {} as Record<string, number>,
      anomalies: {} as Record<string, number>,
      generatedAt: Date.now(),
    };

    transactions.forEach((transaction) => {
      const risk = calculateRiskFactors(transaction, transactions);
      const patterns = analyzeTransactionPatterns(transaction, transactions);
      const anomalies = detectAnomalies(transaction, transactions);

      analyticsData.totalRisk += risk;
      if (risk > 0.7) analyticsData.highRiskTransactions++;

      analyticsData.patterns[transaction.id] = patterns;
      analyticsData.anomalies[transaction.id] = anomalies;
    });

    setTimeout(() => {
      setRiskAnalytics(analyticsData);
      setIsAnalyzing(false);
    }, 2000);
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
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <DollarSign size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                ${summary ? summary.totalAmount.toLocaleString() : '0'}
              </div>
              <div className="stat-label">Total Amount</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                ${summary ? summary.totalCredits.toLocaleString() : '0'}
              </div>
              <div className="stat-label">Total Credits</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <TrendingDown size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                ${summary ? summary.totalDebits.toLocaleString() : '0'}
              </div>
              <div className="stat-label">Total Debits</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {filteredTransactions.length.toLocaleString()}
                {filteredTransactions.length !== transactions.length && (
                  <span className="stat-total"> of {transactions.length.toLocaleString()}</span>
                )}
              </div>
              <div className="stat-label">
                Transactions
                {isAnalyzing && <span> (Analyzing...)</span>}
                {riskAnalytics && <span> - Risk: {riskAnalytics.highRiskTransactions}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-controls">
        <SearchBar onSearch={handleSearch} />

        <div className="filter-controls">
          <select
            value={filters.type || 'all'}
            onChange={(e) =>
              handleFilterChange({
                ...filters,
                type: e.target.value as 'debit' | 'credit' | 'all',
              })
            }
          >
            <option value="all">All Types</option>
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>

          <select
            value={filters.status || 'all'}
            onChange={(e) =>
              handleFilterChange({
                ...filters,
                status: e.target.value as 'pending' | 'completed' | 'failed' | 'all',
              })
            }
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange({ ...filters, category: e.target.value })}
          >
            <option value="">All Categories</option>
            {getUniqueCategories().map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="dashboard-content">
        <TransactionList
          transactions={filteredTransactions}
          totalTransactions={transactions.length}
          onTransactionClick={handleTransactionClick}
        />
      </div>

      {selectedTransaction && (
        <div className="transaction-detail-modal">
          <div className="modal-content">
            <h3>Transaction Details</h3>
            <div className="transaction-details">
              <p>
                <strong>ID:</strong> {selectedTransaction.id}
              </p>
              <p>
                <strong>Merchant:</strong> {selectedTransaction.merchantName}
              </p>
              <p>
                <strong>Amount:</strong> ${selectedTransaction.amount}
              </p>
              <p>
                <strong>Category:</strong> {selectedTransaction.category}
              </p>
              <p>
                <strong>Status:</strong> {selectedTransaction.status}
              </p>
              <p>
                <strong>Date:</strong> {selectedTransaction.timestamp.toLocaleString()}
              </p>
            </div>
            <button onClick={() => setSelectedTransaction(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};
