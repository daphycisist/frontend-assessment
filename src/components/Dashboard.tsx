import React, { useState, useEffect, useCallback, useRef } from "react";

import {
  Transaction,
  FilterOptions,
  TransactionSummary,
} from "../types/transaction";
import {
  calculateSummary,
  startDataRefresh,
  stopDataRefresh,
} from "../utils/dataGenerator";
import {
  workerManager,
  fallbackApplyFilters,
  fallbackGenerateTransactionData
} from "../utils/workerManager";
import { TransactionList } from "./TransactionList";
import { SearchBar } from "./SearchBar";
import { useUserContext } from "../contexts/UserContext";
import { DollarSign, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { 
  generateRiskAssessment,
  analyzeTransactionPatterns,
  calculateRiskFactors,
  detectAnomalies
} from "../utils/analyticsEngine";
import { formatNumber } from "../utils/dateHelpers";


const defaultFilters: FilterOptions = {
  type: "all",
  status: "all",
  category: "",
  searchTerm: "",
};

export const Dashboard: React.FC = () => {
  const inputRef = useRef<HTMLSelectElement>(null);
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
  const [generationProgress, setGenerationProgress] = useState<{
    progress: number;
    generated: number;
    total: number;
  } | null>(null);

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
      setGenerationProgress({ progress: 0, generated: 0, total: 10000 });

      try {
        // Set up progress callback for data generation
        workerManager.onProgressUpdate = (progress, generated, total) => {
          setGenerationProgress({ progress, generated, total });
        };

        let initialData: Transaction[];
        let processingTime: number;

        if (workerManager.isWorkerSupported) {
          console.log('Using web worker for data generation...');
          const result = await workerManager.generateTransactionData(10000);
          initialData = result.transactions;
          processingTime = result.processingTime;
          console.log(`Data generation completed in ${processingTime.toFixed(2)}ms using web worker`);
        } else {
          console.log('Web workers not supported, using fallback...');
          const result = await fallbackGenerateTransactionData(10000);
          initialData = result.transactions;
          processingTime = result.processingTime;
          console.log(`Data generation completed in ${processingTime.toFixed(2)}ms using main thread`);
        }

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
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
        setGenerationProgress(null);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    startDataRefresh(async () => {
      try {
        let newData: Transaction[];
        
        if (workerManager.isWorkerSupported) {
          const result = await workerManager.generateTransactionData(200);
          newData = result.transactions;
        } else {
          const result = await fallbackGenerateTransactionData(200);
          newData = result.transactions;
        }
        
        setTransactions((currentTransactions) => [...currentTransactions, ...newData]);
      } catch (error) {
        console.error('Error generating refresh data:', error);
      }
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

  useEffect(() => {
    if(inputRef.current){
     console.log(inputRef.current.value);
    }
    
  }, [inputRef]);

  const applyFilters = useCallback(async (
    data: Transaction[],
    currentFilters: FilterOptions,
  ) => {
    setIsSearching(true);
    try {
      let filtered: Transaction[];
      
      if (workerManager.isWorkerSupported) {
        console.log('Using web worker for filtering...');
        const startTime = performance.now();
        filtered = await workerManager.applyFilters(data, currentFilters, userPreferences);
        const endTime = performance.now();
        console.log(`Filtering completed in ${(endTime - startTime).toFixed(2)}ms using web worker`);
      } else {
        console.log('Web workers not supported, using fallback...');
        const startTime = performance.now();
        filtered = await fallbackApplyFilters(data, currentFilters, userPreferences);
        const endTime = performance.now();
        console.log(`Filtering completed in ${(endTime - startTime).toFixed(2)}ms using main thread`);
      }

      setFilteredTransactions(filtered);
  
      setUserPreferences((prev) => ({
        ...prev,
        timestamps: { ...prev.timestamps, updated: Date.now() },
      }));


      // Add artificial delay if operations are too fast
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error("Error applying filters:", error);
      // Fallback to original data on error
      setFilteredTransactions(data);
    } finally {
      setIsSearching(false); // Always turn off loading
    }

  }, [transactions, filters, userPreferences]);

  const handleSearch = async (searchTerm: string) => {
    console.log("handleSearch", searchTerm);
    setFilters((prev) => ({ ...prev, searchTerm }));
    trackActivity(`search:${searchTerm}`);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilters = {
      ...filters,
      [event.target.name]: event.target.value,
    };
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
            name="type"
            onChange={handleFilterChange}
            disabled={isSearching}
          >
            <option value="all">All Types</option>
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>

          <select
            value={filters.status || "all"}
            name="status"
            onChange={handleFilterChange}
            disabled={isSearching}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={filters.category || ""}
            name="category"
            onChange={handleFilterChange}
            disabled={isSearching}
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
        {generationProgress && (
          <div className="generation-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${generationProgress.progress}%` }}
              ></div>
            </div>
            <p>Generating transactions: {generationProgress.generated} / {generationProgress.total} ({generationProgress.progress.toFixed(1)}%)</p>
          </div>
        )}
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
