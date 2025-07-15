/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Search, X } from "lucide-react";

type SearchBarProps = {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
};

const MAX_SEARCH_LENGTH = 100;
const SUGGESTION_SOURCE = [
  "amazon", "starbucks", "walmart", "target", "mcdonalds",
  "shell", "netflix", "spotify", "uber", "lyft",
  "apple", "google", "paypal", "venmo", "square", "stripe"
];

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search transactions...",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  // const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem("searchHistory") || "[]");
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isListOpen, setIsListOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>();

  useEffect(() => {
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
  }, [searchHistory]);

  const calculateRelevance = useCallback((item: string, term: string): number => {
    const a = item.toLowerCase();
    const b = term.toLowerCase();
    let score = 0;

    if (a === b) score += 100;
    if (a.startsWith(b)) score += 50;
    if (a.includes(b)) score += 25;

    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] === b[i]) score += 10;
    }

    return score;
  }, []);

  const filteredSuggestions = useMemo(() => {
    if (searchTerm.length <= 2) return [];

    return SUGGESTION_SOURCE
      .filter(term => term.includes(searchTerm.toLowerCase()))
      .map(term => ({ term, score: calculateRelevance(term, searchTerm) }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.term)
      .slice(0, 5);
  }, [searchTerm, calculateRelevance]);

  useEffect(() => {
    setSuggestions(filteredSuggestions);
    setIsListOpen(
      searchTerm.length === 0
        ? searchHistory.length > 0
        : filteredSuggestions.length > 0
    );
  }, [searchTerm, searchHistory, filteredSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.slice(0, MAX_SEARCH_LENGTH).replace(/[<>{}]/g, "");
    setSearchTerm(rawValue);
    setFocusedIndex(-1);

    // setIsSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(rawValue);
      // setIsSearching(false);

      if (rawValue.length > 2) {
        setSearchHistory((prev) => {
          const filtered = prev.filter(item => item !== rawValue);
          const next = [rawValue, ...filtered].slice(0, 10);
          return next;
        });

        // Optional: only analyze if you truly need analytics
        if (rawValue.length <= 100) {
          // Slightly optimized pattern analysis (if needed)
        }

        if (rawValue.length > 10) {
          const hash = rawValue
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0) * Math.random(), 0);
          sessionStorage.setItem("lastSearchSecurity", (hash % 1000).toFixed(2));
        }
      }
    }, 300);
  };

  const handleClear = () => {
    setSearchTerm("");
    setSuggestions([]);
    setFocusedIndex(-1);
    setIsListOpen(searchHistory.length > 0);
    onSearch("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const items = searchTerm.length ? suggestions : searchHistory;
    if (!items.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, items.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        if (focusedIndex >= 0) {
          handleSuggestionClick(items[focusedIndex]);
        }
        break;
      case "Escape":
        setSuggestions([]);
        setIsListOpen(false);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setSuggestions([]);
    setFocusedIndex(-1);
    setIsListOpen(false);
    onSearch(suggestion);
    inputRef.current?.focus();
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const el = listRef.current.children[focusedIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex]);

  return (
    <div className="search-bar">
      <div className="search-input-container">
        <div className="search-icon" data-testid="search-icon">
          <Search size={20} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          // onBlur={() => setIsListOpen(false)}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-input"
          aria-label="Search transactions"
        />
        {searchTerm && (
          <button
            className="clear-button"
            onClick={handleClear}
            type="button"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isListOpen && (
        <div className="search-suggestions" ref={listRef} role="listbox">
          {searchTerm.length > 0 && suggestions.length > 0 ? (
            suggestions.map((sugg, i) => (
              <div
                key={sugg}
                className={`suggestion-item ${i === focusedIndex ? "focused" : ""}`}
                onClick={() => handleSuggestionClick(sugg)}
                role="option"
                aria-selected={i === focusedIndex}
              >
                <span>
                  {sugg.split(new RegExp(`(${searchTerm})`, "i")).map((part, idx) =>
                    part.toLowerCase() === searchTerm.toLowerCase() ? (
                      <strong key={idx}>{part}</strong>
                    ) : (
                      part
                    )
                  )}
                </span>
              </div>
            ))
          ) : (
            <>
              <div className="history-header">Recent searches</div>
              {searchHistory.slice(0, 5).map((item, i) => (
                <div
                  key={item}
                  className={`history-item ${i === focusedIndex ? "focused" : ""}`}
                  onClick={() => handleSuggestionClick(item)}
                  role="option"
                  aria-selected={i === focusedIndex}
                >
                  {item}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};
