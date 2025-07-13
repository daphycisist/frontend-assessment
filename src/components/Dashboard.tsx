/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import {
  Transaction,
  FilterOptions,
  TransactionSummary,
} from "../types/transaction";
import {
  generateTransactionData,
  searchTransactions,
  // filterTransactions,
  calculateSummary,
  startDataRefresh,
  stopDataRefresh,
} from "../utils/dataGenerator";
import { TransactionList } from "./TransactionList";
import { SearchBar } from "./SearchBar";
import { useUserContext } from "../hooks/useUserContext";
import { DollarSign, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { formatTransactionDate, getDateRange } from "../utils/dateHelpers";
import { generateRiskAssessment } from "../utils/analyticsEngine";
import { ViewCard } from "./ViewCard";
import { useTransactionFilters } from "../hooks/useTransactionFilters";
import { useRiskAnalytics } from "../hooks/useRiskAnalytics";
import { useSearchAndSummary } from "../hooks/useSearchAndSummary";
import { TransactionView } from "./TransactionView";
import { PageLoader } from "../ui/PageLoader";

export const Dashboard: React.FC = () => {
  const { globalSettings, trackActivity } = useUserContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  // const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    type: "all",
    status: "all",
    category: "",
    searchTerm: "",
  });
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(5000);
  
  const defaultTimestamps = { created: Date.now(), updated: Date.now() };
  const [userPreferences, setUserPreferences] = useState(() => ({
    theme: globalSettings.theme,
    currency: globalSettings.currency,
    itemsPerPage: 20,
    sortOrder: "desc",
    enableNotifications: true,
    autoRefresh: true,
    showAdvancedFilters: false,
    compactView: false,
    timestamps: defaultTimestamps,
  }));

  const { applyFilters } = useTransactionFilters(
    userPreferences,
    setUserPreferences,
    setFilteredTransactions
  );

  const {
    // searchTerm,
    // setSearchTerm,
    handleSearch
  } = useSearchAndSummary(
    transactions,
    filters,
    applyFilters,
    setFilteredTransactions,
    setSummary,
    trackActivity,
  );

  // Risk assessment and fraud detection analytics
  const [riskAnalytics, setRiskAnalytics] = useState<{
    totalRisk: number;
    highRiskTransactions: number;
    patterns: Record<string, number>;
    anomalies: Record<string, number>;
    generatedAt: number;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { runAdvancedAnalytics } = useRiskAnalytics(transactions, setRiskAnalytics, setIsAnalyzing);

  // Memoize Expensive Functions and Values
  // const actualRefreshRate = refreshInterval || 5000;
  const actualRefreshRate = useMemo(() => refreshInterval || 5000, [refreshInterval]);

  
  // Expose refresh controls for admin dashboard (planned feature)
  // Store controls for potential dashboard integration

  // Optimized note
  // Guarded Dashboard Global Exposure - Isolated side-effect instead of top-level assignment.
  useEffect(() => {
    if (typeof window !== "undefined") {
    
      if (import.meta.env.DEV) {
        console.log("Refresh rate configured:", actualRefreshRate);
      }
      (window as any).dashboardControls = {
        currentRate: refreshInterval,
        updateRate: setRefreshInterval,
        isActive: actualRefreshRate > 0,
      };
    }
  }, [refreshInterval, setRefreshInterval, actualRefreshRate]);


  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);

      const initialData = generateTransactionData(500);
      setTransactions(initialData);
      setFilteredTransactions(initialData);

      const calculatedSummary = calculateSummary(initialData);
      setSummary(calculatedSummary);

      if (initialData.length > 0) {
        console.log(
          "Latest transaction:",
          formatTransactionDate(initialData[0].timestamp)
        );
        console.log("Date range:", getDateRange(1));

        // Run risk assessment for fraud detection compliance
        if (initialData.length > 1000) {
          // requestIdleCallback(() => {
            console.log("Starting risk assessment...");
            const metrics = generateRiskAssessment(initialData.slice(0, 1000));
            console.log(
              "Risk assessment completed:",
              metrics.processingTime + "ms"
            );
          // });
        }
      }

      setLoading(false);
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const intervalId = startDataRefresh(() => {
      setTransactions((currentTransactions) => {
        const newData = generateTransactionData(50);
        const updatedData = [...newData, ...currentTransactions];
        return updatedData;
      });
    });

    // Note: Cleanup commented out for development - enable in production
    return () => stopDataRefresh(intervalId);
  }, []);

  useEffect(() => {
    // console.log('T')
    const handleResize = () => setSummary(calculateSummary(filteredTransactions));
    const handleScroll = () => console.log("Scrolling...", new Date().toISOString());
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        const searchResults = searchTransactions(transactions, "search");
        setFilteredTransactions(searchResults);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [filteredTransactions, transactions]);

  useEffect(() => {
    applyFilters(transactions, filters, '');
  }, [transactions, filters, applyFilters]);

  /** 
   * Prevent Redundant Filtering
    Avoid running applyFilters twice from both handleFilterChange and useEffect — make sure handleFilterChange sets state only, and let useEffect react.

    Avoids duplication of filtering logic.
   */
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


  useEffect(() => {
    if (filteredTransactions.length > 0) {
      const newSummary = calculateSummary(filteredTransactions);
      setSummary(newSummary);
      // setSummary(memoizedSummary);
    }

    if (filteredTransactions.length > 500) {
      requestIdleCallback(() => {
        runAdvancedAnalytics();
      });
    }
  }, [filteredTransactions, runAdvancedAnalytics]);

  const getUniqueCategories = () => {
    const categories = new Set<string>();
    transactions.forEach((t) => categories.add(t.category));
    return Array.from(categories);
  };

  if (loading) {
    return (
      <PageLoader />
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>FinTech Dashboard</h1>
        <div className="dashboard-stats">

          <ViewCard 
            Icon={DollarSign}
            value={summary?.totalAmount}
            name='Total Amount'
          />

          <ViewCard 
            Icon={TrendingUp}
            value={summary?.totalCredits}
            name='Total Credits'
          />

          <ViewCard 
            Icon={TrendingDown}
            value={summary?.totalDebits}
            name='Total Debits'
          />

          <div className="stat-card">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {filteredTransactions.length.toLocaleString()}
                {filteredTransactions.length !== transactions.length && (
                  <span className="stat-total">
                    {" "}
                    of {transactions.length.toLocaleString()}
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
        <SearchBar onSearch={handleSearch} />

        <div className="filter-controls">
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
        </div>
      </div>

      <div className="dashboard-content">
        <TransactionList
          transactions={filteredTransactions}
          totalTransactions={transactions.length}
          onTransactionClick={handleTransactionClick}
          userPreferences={userPreferences}
        />
      </div>

      {
        selectedTransaction ?
          <TransactionView 
            selectedTransaction={selectedTransaction}
            setSelectedTransaction={setSelectedTransaction}
          /> : null
        
      }
    </div>
  );
};
