// hooks/useSearchAndSummary.ts
import { useState, useCallback } from "react";
import { debounce } from "lodash";
import { filterTransactions, searchTransactions } from "../utils/dataGenerator";
import { calculateSummary } from "../utils/dataGenerator";
import { FilterOptions, Transaction, TransactionSummary } from "../types/transaction";

export const useSearchAndSummary = (
  transactions: Transaction[],
  filters: FilterOptions,
  setFilteredTransactions: (tx: Transaction[]) => void,
  setSummary: (summary: TransactionSummary) => void,
  trackActivity: (val: string) => void,
  searchSectionRef: React.RefObject<HTMLElement>,
) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = (
    debounce(
      (term: string) => {
        if (!term) return;
        const searched = searchTransactions(transactions, term);
        const filtered = filterTransactions(searched, filters);
        setFilteredTransactions(filtered);
        setSummary(calculateSummary(filtered));
      },
      300,
      { leading: false, trailing: true }
    )
  );

  const normalizeSearchInput = useCallback((term: string): string => {
    const lower = term.toLowerCase().trim();
    return lower
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // strip diacritics
      .replace(/[^a-z0-9\s]/gi, "") // remove punctuation
      .replace(/\s+/g, " ");
  }, []);
  
  const handleSearch = useCallback(
    (term: string) => {
      const normalized = normalizeSearchInput(term);
      setSearchTerm(normalized);
      searchSectionRef.current?.focus();
      trackActivity(`search:${normalized}`);
      debouncedSearch(normalized);
    },
    [normalizeSearchInput, debouncedSearch, trackActivity, searchSectionRef]
  );

  return {
    searchTerm,
    handleSearch,
  };
};
