/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Transaction,
  FilterOptions,
  TransactionSummary,
  UserPreferences,
  UserContextType,
} from "../types/transaction";
import {
  generateTransactionDataAsync,
  // searchTransactions,
  calculateSummary,
  startDataRefresh,
  stopDataRefresh,
  // generateTransactionData,
} from "../utils/dataGenerator";
import { SearchBar } from "./SearchBar";
import { useUserContext } from "../hooks/useUserContext";
import { DollarSign, TrendingUp, TrendingDown, Clock } from "lucide-react";
// import { formatTransactionDate, getDateRange } from "../utils/dateHelpers";
import { generateRiskAssessment } from "../utils/analyticsEngine";
import { ViewCard } from "./ViewCard";
import { useTransactionFilters } from "../hooks/useTransactionFilters";
import { useRiskAnalytics } from "../hooks/useRiskAnalytics";
import { useSearchAndSummary } from "../hooks/useSearchAndSummary";
import { TransactionView } from "./TransactionView";
import { PageLoader } from "../ui/PageLoader";
import { TransactionFilters } from "./TransactionFilters";
import { TransactionList } from "./TransactionList";
import { ErrorBoundary } from "./ErrorBoundary";
import { DashboardNav } from "./DashboardNav";

export const Dashboard: React.FC = () => {
  const { globalSettings, trackActivity } = useUserContext() as UserContextType;
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
  const searchSectionRef = useRef<HTMLElement>(null);
  const resultsSectionRef = useRef<HTMLElement>(null);
  const filtersSectionRef = useRef<HTMLElement>(null);

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
    trackActivity,
    searchSectionRef,
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
    let isMounted = true;
    const loadInitialData = async () => {
      const initialData: Transaction[] = [];
      setLoading(true);

      await generateTransactionDataAsync(
      10_000,
      (chunk: Transaction[]) => {
          if (initialData?.length < 1000) initialData.push(...chunk);
          setTransactions((prev) => [...prev, ...chunk]);
          setFilteredTransactions((prev) => [...prev, ...chunk]);
        },
        100
      );
      // initialData = globalTransactionCache?.slice(0, 1000);

      // setTransactions(globalTransactionCache);
      // setFilteredTransactions(globalTransactionCache);
      // setTransactions((prev) => [...prev, ...chunk]);
      // setFilteredTransactions((prev) => [...prev, ...chunk]);
      // updateSummary(chunk);
      // }
      if (initialData.length > 1000) {
        console.log("Starting risk assessment...");
        const metrics = generateRiskAssessment(initialData.slice(0, 1000));
        console.log(
          "Risk assessment completed:",
          metrics.processingTime + "ms"
        );
      }

      setLoading(false);
    };

    if (isMounted) loadInitialData();
    return () => {
      isMounted = false;
      setTransactions([]);
      setFilteredTransactions([]);
      setSummary({} as TransactionSummary);
      // if (worker) worker.terminate();
    };
  }, [updateSummary, throttle]);

  useEffect(() => {
    if (filteredTransactions?.length) {
      updateSummary(filteredTransactions);
    }
  }, [filteredTransactions, updateSummary])

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
      // setTransactions((currentTransactions) => {
      //   const newData = generateTransactionData(200);
      //   const updatedData = [...currentTransactions, ...newData]; // Append and cap at 1,000
      //   // const updatedData = [...currentTransactions, ...newData].slice(-1000); // Append and cap at 1,000
      //   updateSummary(newData);
      //   applyFilters(updatedData, filters, "");
      //   return updatedData;
      // });
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
    applyFilters(transactions, filters, filters?.searchTerm ?? '');
  }, [transactions, filters, applyFilters]);

  // Run analytics on filtered transactions
  useEffect(() => {
    if (filteredTransactions.length > 1000) {
      requestIdleCallback(() => runAdvancedAnalytics());
    }
  }, [filteredTransactions, runAdvancedAnalytics]);

  if (loading) {
    return <PageLoader />;
  }

  const handleCloseTransactionView = () => {
    setSelectedTransaction(null);
    resultsSectionRef.current?.focus();
  };

  return (
    <>
      {
        loading && !filteredTransactions?.length 
        ? <PageLoader />
        : (
        <main className="dashboard"  aria-label="Transaction Dashboard">
          
          <DashboardNav />
          
          <section className="dashboard-wrapper">
            <div className="dashboard-header">
              <div className="dashboard-stats" role="region" aria-label="Transaction statistics">
                <ViewCard 
                  Icon={DollarSign} 
                  value={summary?.totalAmount} 
                  name="Total Amount"
                  ariaLabel={`Total amount: ${summary?.totalAmount || 0}`}
                />
                <ViewCard 
                  Icon={TrendingUp} 
                  value={summary?.totalCredits} 
                  name="Total Credits" 
                  ariaLabel={`Total credits: ${summary?.totalCredits || 0}`}
                />
                <ViewCard 
                  Icon={TrendingDown} 
                  value={summary?.totalDebits} 
                  name="Total Debits"
                  ariaLabel={`Total debits: ${summary?.totalDebits || 0}`}
                />
                <div className="stat-card" role="region" aria-label="Transaction count">
                  <div className="stat-icon">
                    <Clock size={24} aria-hidden="true" />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {filteredTransactions?.length.toLocaleString()}
                      {filteredTransactions.length !== transactions.length && (
                        <span className="stat-total"> of {transactions.length.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="stat-label" id="transaction-count-label">
                      Transactions
                      {isAnalyzing && <span> (Analyzing...)</span>}
                      {riskAnalytics && <span> - Risk: {riskAnalytics.highRiskTransactions}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <section 
            ref={searchSectionRef}
            tabIndex={-1}
            aria-label="Search and filter controls"
            className="dashboard-controls">
              <ErrorBoundary>
                <SearchBar onSearch={handleSearch} />
              </ErrorBoundary>

              <nav
              ref={filtersSectionRef}
              tabIndex={-1}
              aria-label="Transaction filters"
              >
                <TransactionFilters filters={filters} setFilters={setFilters} transactions={transactions} />
              </nav>
            </section>

            <section 
            ref={resultsSectionRef}
            tabIndex={-1}
            aria-label="Transaction results"
            aria-live="polite"
            className="dashboard-content">
              <ErrorBoundary>
                <TransactionList
                  transactions={filteredTransactions}
                  totalTransactions={transactions.length}
                  onTransactionClick={handleTransactionClick}
                  userPreferences={userPreferences}
                  aria-describedby="results-count"
                />
              </ErrorBoundary>
            </section>

            {selectedTransaction && (
              <TransactionView
                selectedTransaction={selectedTransaction}
                handleCloseTransactionView={handleCloseTransactionView}
              />
            )}
          </section>
        </main>
        )
      }
    </>
  );
};