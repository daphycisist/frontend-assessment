import { useEffect, useState, useCallback } from 'react';
import {
  generateTransactionData,
  searchTransactions,
  filterTransactions,
  calculateSummary,
  startDataRefresh,
} from '../utils/dataGenerator';
import { FilterOptions, Transaction, TransactionSummary } from '../types/transaction';

const MAX_TRANSACTIONS = 10000;

export const useTransactions = (initialCount = MAX_TRANSACTIONS) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    status: 'all',
    category: '',
    searchTerm: '',
  });
  const [summary, setSummary] = useState<TransactionSummary | null>(null);

  // load initial data
  useEffect(() => {
    const data = generateTransactionData(initialCount);
    setTransactions(data);
    setFilteredTransactions(data);
    setSummary(calculateSummary(data));
  }, [initialCount]);

  // auto refresh every 10s (see dataGenerator)
  useEffect(() => {
    const stop = startDataRefresh(() => {
      setTransactions((current) => {
        const combined = [...current, ...generateTransactionData(200)];
        return combined.length > MAX_TRANSACTIONS
          ? combined.slice(combined.length - MAX_TRANSACTIONS)
          : combined;
      });
    });

    return () => {
      // stopDataRefresh in util cleans interval
      stop;
    };
  }, []);

  // re-apply filters when dependencies change
  useEffect(() => {
    applyFilters(transactions, filters);
  }, [transactions, filters]);

  const applyFilters = (data: Transaction[], currentFilters: FilterOptions) => {
    let filtered = [...data];

    if (currentFilters.searchTerm) {
      filtered = searchTransactions(filtered, currentFilters.searchTerm);
    }

    if (currentFilters.type && currentFilters.type !== 'all') {
      filtered = filterTransactions(filtered, { type: currentFilters.type });
    }

    if (currentFilters.status && currentFilters.status !== 'all') {
      filtered = filterTransactions(filtered, { status: currentFilters.status });
    }

    if (currentFilters.category) {
      filtered = filterTransactions(filtered, { category: currentFilters.category });
    }

    setFilteredTransactions(filtered);
    setSummary(calculateSummary(filtered));
  };

  const handleSearch = useCallback((term: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: term }));
  }, []);

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
  }, []);

  const getUniqueCategories = useCallback(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.category));
    return Array.from(set);
  }, [transactions]);

  return {
    transactions,
    filteredTransactions,
    summary,
    filters,
    handleSearch,
    handleFilterChange,
    getUniqueCategories,
  } as const;
};
