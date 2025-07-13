import React, { useState, useEffect, useCallback } from "react";
import { RefreshCcw } from "lucide-react";

import {
  Transaction,
  FilterOptions,
  TransactionSummary,
} from "../types/transaction";
import {
  generateTransactionData,
  searchTransactions,
  filterTransactions,
  calculateSummary,
  startDataRefresh,
  stopDataRefresh,
} from "../utils/dataGenerator";
import { TransactionList } from "./TransactionList";
import { SearchBar } from "./SearchBar";
import { useUserContext } from "../contexts/UserContext";
import { DollarSign, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { 
  analyzeTransactionPatterns, 
  calculateRiskFactors, 
  detectAnomalies, 
  generateRiskAssessment 
} from "../utils/analyticsEngine";
import { formatNumber } from "../utils/dateHelpers";


const defaultFilters: FilterOptions = {
  type: "all",
  status: "all",
  category: "",
  searchTerm: "",
};

export const Dashboard: React.FC = () => {
  const { globalSettings, trackActivity } = useUserContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(5000);
  const [userPreferences, setUserPreferences] = useState({
    theme: globalSettings.theme,
    currency: globalSettings.currency,
    itemsPerPage: 50,
    sortOrder: "desc",
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
    console.log("Refresh rate configured:", actualRefreshRate);
  }

  // Expose refresh controls for admin dashboard (planned feature)
  const refreshControls = {
    currentRate: refreshInterval,
    updateRate: setRefreshInterval,
    isActive: actualRefreshRate > 0,
  };

  // Store controls for potential dashboard integration
  if (typeof window !== "undefined") {
    (
      window as { dashboardControls?: typeof refreshControls }
    ).dashboardControls = refreshControls;
  }

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);

      const initialData = await generateTransactionData(10000);
      setTransactions(initialData);
      setFilteredTransactions(initialData);

      const calculatedSummary = await calculateSummary(initialData);
      setSummary(calculatedSummary);

      // Run risk assessment for fraud detection compliance
      if (initialData.length > 1000) {
        console.log("Starting risk assessment...");
        const metrics = await generateRiskAssessment(initialData.slice(0, 1000));
        console.log(
          "Risk assessment completed:",
          metrics.processingTime + "ms"
        );
      }

      setLoading(false);
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    startDataRefresh(async () => {
      const newData = await generateTransactionData(200);
      setTransactions((currentTransactions) => [...currentTransactions, ...newData]);
    });
    // Note: Cleanup commented out for development - enable in production
    return () => stopDataRefresh();
  }, []);

  useEffect(() => {
    applyFilters(transactions, filters);
  }, [filters]);


  useEffect(() => {
    (async () => {
    if (filteredTransactions.length > 0) {
      const newSummary = await calculateSummary(filteredTransactions);
      setSummary(newSummary);
    }

    if (filteredTransactions.length > 500) {
      runAdvancedAnalytics();
    }
  })();

  }, [filteredTransactions]);

  const applyFilters = useCallback(async (
    data: Transaction[],
    currentFilters: FilterOptions,
  ) => {
    setIsSearching(true);
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
  
        setFilteredTransactions(enrichedFiltered);
      } else {
        setFilteredTransactions(filtered);
      }
  
      setUserPreferences((prev) => ({
        ...prev,
        timestamps: { ...prev.timestamps, updated: Date.now() },
      }));

      // Add artificial delay if operations are too fast
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error("Error applying filters:", error);
    } finally {
      setIsSearching(false); // Always turn off loading
    }

  }, [transactions, filters, userPreferences]);

  const handleSearch = async (searchTerm: string) => {
    console.log("handleSearch", searchTerm);
    setFilters((prev) => ({ ...prev, searchTerm }));
    trackActivity(`search:${searchTerm}`);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);

    const relatedTransactions = transactions.filter(
      (t) =>
        t.merchantName === transaction.merchantName ||
        t.category === transaction.category ||
        t.userId === transaction.userId
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

    console.log("Related transactions:", relatedTransactions.length);
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

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    applyFilters(transactions, defaultFilters);
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
                ${summary ? formatNumber(summary.totalAmount) : "0"}
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
                ${summary ? formatNumber(summary.totalCredits) : "0"}
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
                ${summary ? formatNumber(summary.totalDebits) : "0"}
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
                {formatNumber(filteredTransactions.length)}
                {filteredTransactions.length !== transactions.length && (
                  <span className="stat-total">
                    {" "}
                    of {formatNumber(transactions.length)}
                  </span>
                )}
              </div>
              <div className="stat-label">
                Transactions
                {isAnalyzing && <span> (Analyzing...)</span>}
                {riskAnalytics && (
                  <span> - Risk: {riskAnalytics.highRiskTransactions}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-controls">
        <SearchBar onSearch={handleSearch} isLoading={isSearching}  />

          <select
            value={filters.type || "all"}
            onChange={(e) =>
              handleFilterChange({
                ...filters,
                type: e.target.value as "debit" | "credit" | "all",
              })
            }
          >
            <option value="all">All Types</option>
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>

          <select
            value={filters.status || "all"}
            onChange={(e) =>
              handleFilterChange({
                ...filters,
                status: e.target.value as
                  | "pending"
                  | "completed"
                  | "failed"
                  | "all",
              })
            }
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={filters.category || ""}
            onChange={(e) =>
              handleFilterChange({ ...filters, category: e.target.value })
            }
          >
            <option value="">All Categories</option>
            {getUniqueCategories().map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <button className="clear-filters-btn" onClick={handleResetFilters} disabled={JSON.stringify(filters) === JSON.stringify(defaultFilters)}>
            Clear filters
          </button>
      </div>

      <div className="dashboard-content">
        <TransactionList
          transactions={filteredTransactions}
          totalTransactions={transactions.length}
          onTransactionClick={handleTransactionClick}
          isLoading={isSearching}
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
                <strong>Date:</strong>{" "}
                {selectedTransaction.timestamp.toLocaleString()}
              </p>
            </div>
            <button onClick={() => setSelectedTransaction(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};
