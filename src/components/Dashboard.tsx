import React, { useState, useEffect } from 'react';
import type { Transaction } from '../types/transaction';
import { TransactionList } from './TransactionList';
import { ErrorBoundary } from './ErrorBoundary';
import { useUserContext } from '../contexts/UserContext';
import { HeaderStats } from './HeaderStats';
import { FilterPanel } from './FilterPanel';
import { TransactionModal } from './TransactionModal';
import { DarkModeToggle } from './DarkModeToggle';

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
  useUserContext();

  const {
    transactions,
    filteredTransactions,
    summary,
    filters,
    handleSearch,
    handleFilterChange,
    getUniqueCategories,
  } = useTransactions();

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const [riskAnalytics, setRiskAnalytics] = useState<{
    totalRisk: number;
    highRiskTransactions: number;
    patterns: Record<string, number>;
    anomalies: Record<string, number>;
    generatedAt: number;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  // run analytics when data set is large

  useEffect(() => {
    if (filteredTransactions.length > 1000) {
      runAdvancedAnalytics();
    }
  }, [filteredTransactions]);

  // applyFilters handled inside useTransactions;

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const runAdvancedAnalytics = () => {
    if (!workerRef.current) return;
    if (transactions.length < 1000) return; // skip small datasets

    setIsAnalyzing(true);
    workerRef.current.postMessage(transactions);
  };

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
        <DarkModeToggle />
      </div>

      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        categories={getUniqueCategories()}
      />

      <div className="dashboard-content">
        <ErrorBoundary>
          <TransactionList
            transactions={filteredTransactions}
            totalTransactions={transactions.length}
            onTransactionClick={handleTransactionClick}
          />
        </ErrorBoundary>
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
