/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import {
  Transaction,
  FilterOptions,
  TransactionSummary,
  UserPreferences,
} from "../types/transaction";
import {
  generateTransactionDataAsync,
  // searchTransactions,
  calculateSummary,
  startDataRefresh,
  stopDataRefresh,
  generateTransactionData,
} from "../utils/dataGenerator";
// import { TransactionList } from "./TransactionList"; // Use optimized TransactionList
import { SearchBar } from "./SearchBar";
import { useUserContext } from "../hooks/useUserContext";
import { DollarSign, TrendingUp, TrendingDown, Clock } from "lucide-react";
// import { formatTransactionDate, getDateRange } from "../utils/dateHelpers";
// import { generateRiskAssessment } from "../utils/analyticsEngine";
import { ViewCard } from "./ViewCard";
import { useTransactionFilters } from "../hooks/useTransactionFilters";
import { useRiskAnalytics } from "../hooks/useRiskAnalytics";
import { useSearchAndSummary } from "../hooks/useSearchAndSummary";
import { TransactionView } from "./TransactionView";
import { PageLoader } from "../ui/PageLoader";
import { TransactionFilters } from "./TransactionFilters";
import { TransactionList } from "./TransactionList";
import { ErrorBoundary } from "./ErrorBoundary";

// Web Worker for data generation
// const worker = typeof window !== "undefined" ? new Worker(new URL("./worker.ts", import.meta.url)) : null;

export const Dashboard: React.FC = () => {
  const { globalSettings, trackActivity } = useUserContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    type: "all",
    status: "all",
    category: "",
    searchTerm: "",
  });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [refreshInterval] = useState<number>(5000);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const defaultTimestamps = { created: Date.now(), updated: Date.now() };
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    theme: globalSettings.theme,
    currency: globalSettings.currency,
    itemsPerPage: 20,
    sortOrder: "desc",
    enableNotifications: true,
    autoRefresh: true,
    showAdvancedFilters: false,
    compactView: false,
    timestamps: defaultTimestamps,
  });

  const { applyFilters } = useTransactionFilters(userPreferences, setUserPreferences, setFilteredTransactions);
  const { handleSearch } = useSearchAndSummary(
    transactions,
    filters,
    applyFilters,
    setFilteredTransactions,
    setSummary,
    trackActivity
  );

  const [riskAnalytics, setRiskAnalytics] = useState<{
    totalRisk: number;
    highRiskTransactions: number;
    patterns: Record<string, number>;
    anomalies: Record<string, number>;
    generatedAt: number;
  } | null>(null);
  const { runAdvancedAnalytics } = useRiskAnalytics(transactions, setRiskAnalytics, setIsAnalyzing);

  // Throttle function
  const throttle = useCallback(<T extends (...args: any[]) => void>(fn: T, wait: number) => {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= wait) {
        lastCall = now;
        fn(...args);
      }
    };
  }, []);

  // Incremental summary update
  const updateSummary = useCallback((chunk: Transaction[]) => {
    setSummary(calculateSummary(chunk));
  }, []);

  // Load initial data with Web Worker
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      // if (worker) {
      //   worker.onmessage = ({ data }) => {
      //     if (data.chunk) {
      //       throttle((chunk: Transaction[]) => {
      //         setTransactions((prev) => [...prev, ...chunk]);
      //         setFilteredTransactions((prev) => [...prev, ...chunk]);
      //         updateSummary(chunk);
      //       }, 500)(data.chunk);
      //     } else if (data.done) {
      //       setLoading(false);
      //     }
      //   };
      //   worker.postMessage({ total: 500, chunkSize: 500 });
      // } else {
        await generateTransactionDataAsync(
          500,
          throttle((chunk: Transaction[]) => {
            setTransactions((prev) => [...prev, ...chunk]);
            setFilteredTransactions((prev) => [...prev, ...chunk]);
            updateSummary(chunk);
          }, 500),
          500
        );
      // }
      setLoading(false);
    };

    loadInitialData();
    return () => {
      setTransactions([]);
      setFilteredTransactions([]);
      setSummary({} as TransactionSummary);
      // if (worker) worker.terminate();
    };
  }, [updateSummary, throttle]);

  // Auto-refresh with capped transactions
  useEffect(() => {
    if (!userPreferences.autoRefresh) return;

    let isInteracting = false;

    // Detect user interaction to pause refresh
    const handleInteraction = throttle(() => {
      isInteracting = true;
      setTimeout(() => {
        isInteracting = false;
      }, 500); // Resume after 5s inactivity
    }, 100);

    window.addEventListener("scroll", handleInteraction);
    window.addEventListener("click", handleInteraction);

    const intervalId = startDataRefresh(() => {
      if (isInteracting) return; // Skip refresh during interaction
      setTransactions((currentTransactions) => {
        const newData = generateTransactionData(500);
        // const updatedData = [...currentTransactions, ...newData]; // Append and cap at 1,000
        const updatedData = [...currentTransactions, ...newData].slice(-1000); // Append and cap at 1,000
        updateSummary(newData);
        applyFilters(updatedData, filters, "");
        return updatedData;
      });
    }, refreshInterval);

    return () => {
      stopDataRefresh(intervalId);
      window.removeEventListener("scroll", handleInteraction);
      window.removeEventListener("click", handleInteraction);
    };
  }, [refreshInterval, userPreferences.autoRefresh, updateSummary, applyFilters, filters, throttle]);

  // Optimized event listeners
  useEffect(() => {
    const debouncedResize = throttle(() => {
      // Only recalculate summary if filters changed
      if (filteredTransactions.length > 0) {
        setSummary(calculateSummary(filteredTransactions));
      }
    }, 500);

    const debouncedScroll = throttle(() => {
      console.log("Scrolling...", new Date().toISOString());
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        handleSearch("search");
      }
    };

    window.addEventListener("resize", debouncedResize);
    window.addEventListener("scroll", debouncedScroll);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", debouncedResize);
      window.removeEventListener("scroll", debouncedScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [filteredTransactions, handleSearch, throttle]);

  // Optimized transaction click handler
  const handleTransactionClick = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    requestIdleCallback(() => {
      const relatedTransactions = transactions
        .filter(t => t.merchantName === transaction.merchantName || t.category === transaction.category || t.userId === transaction.userId)
        .slice(0, 50); // Limit to 50 for performance
      trackActivity("transaction_click");
      console.log("Related transactions:", relatedTransactions.length);
    });
  }, [transactions, trackActivity]);

  // Apply filters when transactions or filters change
  useEffect(() => {
    applyFilters(transactions, filters, "");
  }, [transactions, filters, applyFilters]);

  // Run analytics on filtered transactions
  useEffect(() => {
    if (filteredTransactions.length > 500) {
      requestIdleCallback(() => runAdvancedAnalytics());
    }
  }, [filteredTransactions, runAdvancedAnalytics]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>FinTech Dashboard</h1>
        <div className="dashboard-stats">
          <ViewCard Icon={DollarSign} value={summary?.totalAmount} name="Total Amount" />
          <ViewCard Icon={TrendingUp} value={summary?.totalCredits} name="Total Credits" />
          <ViewCard Icon={TrendingDown} value={summary?.totalDebits} name="Total Debits" />
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
        <TransactionFilters filters={filters} setFilters={setFilters} transactions={transactions} />
      </div>

      <div className="dashboard-content">
        <ErrorBoundary>
          <TransactionList
            transactions={filteredTransactions}
            totalTransactions={transactions.length}
            onTransactionClick={handleTransactionClick}
            userPreferences={userPreferences}
            // fetchMoreData={fetchMoreData}
          />
        </ErrorBoundary>
      </div>

      {selectedTransaction && (
        <TransactionView
          selectedTransaction={selectedTransaction}
          setSelectedTransaction={setSelectedTransaction}
        />
      )}
    </div>
  );
};