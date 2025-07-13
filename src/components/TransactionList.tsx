/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Transaction, UserPreferences } from "../types/transaction";
import { TransactionItem } from "./TransactionItems";
// import { FixedSizeList as List } from "react-window";

interface TransactionListProps {
  transactions: Transaction[];
  totalTransactions?: number;
  onTransactionClick: (transaction: Transaction) => void;
  userPreferences: UserPreferences;
  fetchMoreData?: (page: number, itemsPerPage: number) => Promise<Transaction[]>;
}

type PagesInfo = {
  currentPage: number;
  totalPages: number;
  pagination: number;
};

const MemoizedTransactionItem = React.memo(TransactionItem);

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  totalTransactions,
  onTransactionClick,
  userPreferences,
}) => {
  // const ITEM_HEIGHT = 50; // Verify with TransactionItem height
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [pages, setPages] = useState<PagesInfo>({
    currentPage: 1,
    totalPages: 0,
    pagination: 0,
  });
  const { currentPage, totalPages, pagination } = pages;

  // Throttle mouse events
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

  // Format transactions
  const formatTransaction = useCallback(
    (t: Transaction) => ({
      ...t,
      formattedAmount: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(t.amount),
    }),
    []
  );

  // Memoized paginated data
  const paginatedData = useMemo(() => {
    const itemsPerPage = userPreferences.itemsPerPage;
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return transactions.slice(start, end).map(formatTransaction);
  }, [transactions, currentPage, userPreferences.itemsPerPage, formatTransaction]);

  // Update displayed transactions
  useEffect(() => {
    const itemsPerPage = userPreferences.itemsPerPage;
    const maxPages = Math.ceil((totalTransactions || transactions.length) / itemsPerPage);
    setPages((prev) => ({ ...prev, totalPages: maxPages }));
  }, [totalTransactions, userPreferences.itemsPerPage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setSelectedItems({});
      setHoveredItem(null);
    };
  }, []);

  // Total amount
  const totalAmount = useMemo(() => {
    return paginatedData.reduce((sum, t) => sum + t.amount, 0);
  }, [paginatedData]);

  // Event handlers
  const handleItemClick = useCallback(
    (transaction: Transaction) => {
      setSelectedItems((prev) => ({
        ...prev,
        [transaction.id]: !prev[transaction.id],
      }));
      onTransactionClick(transaction);
    },
    [onTransactionClick]
  );

  const handleMouseEnter = useCallback(throttle((id: string) => setHoveredItem(id), 100), []);
  const handleMouseLeave = useCallback(throttle(() => setHoveredItem(null), 100), []);

  const handlePage = useCallback(
    (action: "next" | "prev", pageNumber = 1) => {
      const adjusted = pageNumber <= 1 ? pageNumber : Math.abs(currentPage - pageNumber);
      setPages((prev) => {
        const nextPage = action === "next" ? Math.min(prev.currentPage + adjusted, totalPages) : Math.max(prev.currentPage - adjusted, 1);
        const result = { ...prev, currentPage: nextPage };
        if (nextPage >= pagination + 5 && pageNumber !== totalPages) {
          result.pagination += 5;
        } else if (nextPage <= pagination + 1) {
          result.pagination -= result.pagination >= 5 ? 5 : 0;
        }
        return result;
      });
    },
    [currentPage, totalPages, pagination]
  );

  const handlePageSelection = useCallback(
    (selectedPage: number) => {
      if (selectedPage > currentPage) handlePage("next", selectedPage);
      else if (selectedPage <= currentPage) handlePage("prev", selectedPage);
    },
    [currentPage, handlePage]
  );

  //  const Row = useCallback(
  //   ({ index, style }: { index: number; style: React.CSSProperties }) => {
  //     const transaction = displayedTransactions[index];
  //     if (!transaction) return null;
  //     return (
  //       <div style={style} className="transaction-row">
  //         <MemoizedTransactionItem
  //           transaction={transaction}
  //           isSelected={!!selectedItems[transaction.id]}
  //           isHovered={hoveredItem === transaction.id}
  //           onClick={() => handleItemClick(transaction)}
  //           onMouseEnter={() => handleMouseEnter(transaction.id)}
  //           onMouseLeave={handleMouseLeave}
  //           rowIndex={index}
  //         />
  //       </div>
  //     );
  //   },
  //   [paginatedData, selectedItems, hoveredItem, handleItemClick, handleMouseEnter, handleMouseLeave]
  // );

  return (
    <div className="transaction-list" role="region" aria-label="Transaction list">
      <div className="transaction-list-header">
        <div className="transaction-list-pagination-wrapper">
          <h2 id="transaction-list-title">
            Transactions ({totalTransactions || paginatedData.length})
          </h2>
          <div className="transaction-list-pagination">
            {[...Array(totalPages).keys()].slice(pagination, pagination + 5).map((page) => (
              <span
                key={page}
                className={`${page + 1 === currentPage ? "active" : ""}`}
                onClick={() => handlePageSelection(page + 1)}
              >
                {page + 1}
              </span>
            ))}
            <span>
              <i>of</i> {totalPages}
            </span>
          </div>
        </div>
        <span className="total-amount" aria-live="polite">
          Total:{" "}
          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalAmount)}
        </span>
      </div>

      <div
          className="transaction-list-container"
          role="grid"
          aria-labelledby="transaction-list-title"
          aria-rowcount={userPreferences.itemsPerPage}
          tabIndex={0}
        >
          {paginatedData?.map((transaction, index) => (
            <MemoizedTransactionItem
              key={transaction.id}
              transaction={transaction}
              isSelected={selectedItems[transaction.id]}
              isHovered={hoveredItem === transaction.id}
              onClick={() => handleItemClick(transaction)}
              onMouseEnter={() => handleMouseEnter(transaction.id)}
              onMouseLeave={handleMouseLeave}
              rowIndex={index}
            />
          ))}
  
          {/* <div ref={observerRef as React.LegacyRef<HTMLDivElement>}></div> */}
        </div>

      <div className="page-counter">
        <button onClick={() => handlePage("prev")} disabled={currentPage === 1}>
          {"<"}
        </button>
        <button onClick={() => handlePage("next")} disabled={currentPage === totalPages}>
          {">"}
        </button>
      </div>
    </div>
  );
};