import React, { useState, useEffect } from 'react';
import type { Transaction } from '../types/transaction';
import { TransactionList } from './TransactionList';
import { useUserContext } from '../contexts/UserContext';
import { HeaderStats } from './HeaderStats';
import { FilterPanel } from './FilterPanel';
import { TransactionModal } from './TransactionModal';

// @ts-ignore - vite worker import
import RiskWorker from '../workers/riskWorker?worker';
import { useTransactions } from '../hooks/useTransactions';

type RiskAnalytics = {
  totalRisk: number;
  highRiskTransactions: number;
  patterns: Record<string, number>;
  anomalies: Record<string, number>;
  generatedAt: number;
};

export const Dashboard: React.FC = () => {
  useUserContext(); // keep hook to retain provider check

  const {
    transactions,
    filteredTransactions,
    summary,
    filters,
    handleSearch,
    handleFilterChange,
    getUniqueCategories,
  } = useTransactions();

  // useTransactions loads data synchronously
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

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

  // initial data load & auto-refresh are handled inside useTransactions hook

  // Filtering side-effects handled inside useTransactions hook

  useEffect(() => {
    if (filteredTransactions.length > 0) {
      // summary handled by hook
    }

    if (filteredTransactions.length > 1000) {
      runAdvancedAnalytics();
    }
  }, [filteredTransactions]);

  useEffect(() => {
    const handleResize = () => {
      /* placeholder if we want dynamic summary on resize later */
    };

    const handleScroll = () => {
      console.log('Scrolling...', new Date().toISOString());
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        // search handled by hook
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

  // applyFilters handled inside useTransactions; local copy removed

  // handleSearch & handleFilterChange come from hook

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);

    const relatedTransactions = transactions.filter(
      (t) =>
        t.merchantName === transaction.merchantName ||
        t.category === transaction.category ||
        t.userId === transaction.userId,
    );

    console.log('Related transactions:', relatedTransactions.length);
  };

  const runAdvancedAnalytics = () => {
    if (!workerRef.current) return;
    if (transactions.length < 1000) return; // skip small datasets

    setIsAnalyzing(true);
    workerRef.current.postMessage(transactions);
  };

  // getUniqueCategories comes from useTransactions hook

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
