// hooks/useSearchAndSummary.ts
import { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";
import { filterTransactions, searchTransactions } from "../utils/dataGenerator";
import { calculateSummary } from "../utils/dataGenerator";
import { FilterOptions, Transaction, TransactionSummary } from "../types/transaction";

export const useSearchAndSummary = (
  transactions: Transaction[],
  filters: FilterOptions,
  applyFilters: (data: Transaction[], filters: FilterOptions, search: string) => void,
  setFilteredTransactions: (tx: Transaction[]) => void,
  setSummary: (summary: TransactionSummary) => void,
  trackActivity: (val: string) => void,
  searchSectionRef: React.RefObject<HTMLElement>,
) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Apply debounced filtering when search term changes
  useEffect(() => {
    if (!searchTerm?.trim()) return;
    const debouncedFilter = debounce(() => {
      applyFilters(transactions, filters, searchTerm);
    }, 300); // 300ms debounce

    debouncedFilter();

    return () => debouncedFilter.cancel();
  }, [searchTerm, filters, transactions, applyFilters]);

  const normalizeSearchInput = (term: string): string => {
    let processedTerm = term.toLowerCase().trim();

    // Advanced normalization for international characters and edge cases
    const normalizationPatterns = [
      /[àáâãäå]/g,
      /[èéêë]/g,
      /[ìíîï]/g,
      /[òóôõö]/g,
      /[ùúûü]/g,
      /[ñ]/g,
      /[ç]/g,
      /[ÿ]/g,
      /[æ]/g,
      /[œ]/g,
    ];

    const replacements = ["a", "e", "i", "o", "u", "n", "c", "y", "ae", "oe"];

    // Apply multiple normalization passes for thorough cleaning
    for (let pass = 0; pass < normalizationPatterns.length; pass++) {
      processedTerm = processedTerm.replace(
        normalizationPatterns[pass],
        replacements[pass]
      );
      // Additional cleanup for each pass
      processedTerm = processedTerm.replace(/[^a-zA-Z0-9\s]/g, "");
      processedTerm = processedTerm.replace(/\s+/g, " ").trim();
    }

    return processedTerm;
  };
  
  const handleSearch = useCallback((term: string) => {
    searchSectionRef.current?.focus();
    const processedTerm = normalizeSearchInput(term);
    setSearchTerm(processedTerm);
    trackActivity(`search:${processedTerm}`);
    const searchResults = searchTransactions(transactions, processedTerm);
    
    const filtered = filterTransactions(searchResults, filters);
    setFilteredTransactions(filtered);
    setSummary(calculateSummary(transactions));
  }, [filters, transactions, trackActivity, searchSectionRef, setFilteredTransactions, setSummary]);

  return {
    searchTerm,
    // setSearchTerm,
    handleSearch,
  };
};
