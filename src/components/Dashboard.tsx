/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, 
  {
    lazy,
    useState,
    useEffect,
    useCallback,
    useRef,
    startTransition,
    Suspense,
  } from "react";
import {
  Transaction,
  FilterOptions,
  TransactionSummary,
  UserPreferences,
  UserContextType,
} from "../types/transaction";
import { calculateSummary, startDataRefresh, stopDataRefresh } from "../utils/dataGenerator";
import { SearchBar } from "./SearchBar";
import { useUserContext } from "../hooks/useUserContext";
import { DollarSign, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { generateRiskAssessment } from "../utils/analyticsEngine";
import { ViewCard } from "./ViewCard";
import { useTransactionFilters } from "../hooks/useTransactionFilters";
import { useRiskAnalytics } from "../hooks/useRiskAnalytics";
import { useSearchAndSummary } from "../hooks/useSearchAndSummary";
import { PageLoader } from "../ui/PageLoader";
import { TransactionFilters } from "./TransactionFilters";
// import { TransactionList } from "./TransactionList";
import { ErrorBoundary } from "./ErrorBoundary";
import { DashboardNav } from "./DashboardNav";
import { generateTransactionData } from "../utils/worker";
import { Loader } from "../ui/Loader";
import { LoadingTransaction } from "../ui/LoadingTransaction";
import localstorage from "../utils/localstorage";

const TransactionView = lazy(() => import('./TransactionView'));
const TransactionList = lazy(() => import('./TransactionList'));

const INITIAL_BATCH = 250;
const BACKGROUND_BATCH = 1000;

export const Dashboard: React.FC = () => {
  const { globalSettings, trackActivity } = useUserContext() as UserContextType;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    type: "all",
    status: "all",
    category: "",
    searchTerm: "",
  });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const searchSectionRef = useRef<HTMLElement>(null);
  const resultsSectionRef = useRef<HTMLElement>(null);
  const filtersSectionRef = useRef<HTMLElement>(null);

  const abortController = useRef(new AbortController());

  const defaultTimestamps = { created: Date.now(), updated: Date.now() };
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    theme: globalSettings.theme,
    currency: globalSettings.currency,
    itemsPerPage: 30,
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
     if (chunk?.length > 0) {
       setSummary(calculateSummary(chunk));
      }
  }, []);

  // Load initial data with Web Worker
  useEffect(() => {
    localstorage.clear()
    let isMounted = true;
    const loadInitialData = async () => {
      const initialData: Transaction[] = [];
      setLoading(true);

      generateTransactionData({
        total: INITIAL_BATCH,
        chunkSize: 250,
        signal: abortController.current.signal,
        onChunk: (chunk) => {
          startTransition(() => {
            setTransactions((prev) => [...prev, ...chunk]);
          });
          startTransition(() => {
            setFilteredTransactions((prev) => ([...prev, ...chunk]))
          });
        },
        onProgress: (p) => setProgress(p * 0.01),
        onDone: () => {
          setLoading(false);

          // Step 2: Load the remaining transactions in the background
          generateTransactionData({
            total: BACKGROUND_BATCH - INITIAL_BATCH,
            chunkSize: 500,
            signal: abortController.current.signal,
            onChunk: (chunk) => {
              startTransition(() => {
                setTransactions((prev) => [...prev, ...chunk]);
              });
              startTransition(() => {
                setFilteredTransactions((prev) => ([...prev, ...chunk]))
              });
            },
            onProgress: (p) =>
              setProgress((prev) => prev + (p * (99 / 100))),
            onDone: () => console.log("All transactions loaded."),
          });
        },
      });

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
      abortController.current.abort();
      // if (worker) worker.terminate();
    };
  }, []);

  useEffect(() => {
    const id = startDataRefresh(() => {
      generateTransactionData({
        total: INITIAL_BATCH,
        chunkSize: 50,
        signal: abortController.current.signal,
        onChunk: (chunk) => {
          startTransition(() => {
            setTransactions((prev) => [...prev, ...chunk]);
          });
        },
        onProgress: (p) =>
          setProgress((prev) => prev + (p * (99 / 100))),
        onDone: () => console.log("All transactions loaded."),
      });
    });

    // Note: Cleanup commented out for development - enable in production
    return () => stopDataRefresh(id);
  }, []);

  useEffect(() => {
    if (filteredTransactions?.length > 0) {
      updateSummary(filteredTransactions);
    }
  }, [filteredTransactions, updateSummary])

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
        (loading && !filteredTransactions?.length) 
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
                        <span className="stat-total"> of {transactions?.length.toLocaleString()}</span>
                      )}
                    </div>

                    <div className="stat-label" id="transaction-count-label">
                      Transactions
                      {
                        isAnalyzing 
                          ? <span> (Analyzing...)</span>
                          : riskAnalytics 
                          ? <span> - Risk: {riskAnalytics.highRiskTransactions}</span>
                          : null
                      }
                    </div>
                  </div>
                  
                  {loading ? <Loader value={progress} /> : null}

                </div>
              </div>
            </div>

            <section 
            // ref={searchSectionRef}
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
                <Suspense fallback={<LoadingTransaction />}>
                  <TransactionList
                    transactions={filteredTransactions?.slice(0, 500)}
                    onTransactionClick={handleTransactionClick}
                    totalTransactions={transactions?.length}
                    userPreferences={userPreferences}
                  />
                </Suspense>
              </ErrorBoundary>
            </section>

            {selectedTransaction && (
              <Suspense fallback={<LoadingTransaction message="Loading transaction..." />}>
                <TransactionView
                  selectedTransaction={selectedTransaction}
                  handleCloseTransactionView={handleCloseTransactionView}
                />
              </Suspense>
            )}
          </section>
        </main>
        )
      }
    </>
  );
};