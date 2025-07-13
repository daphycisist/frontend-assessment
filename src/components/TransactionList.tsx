import React, { useState, useEffect, useMemo, useRef } from "react";
import { Virtuoso } from 'react-virtuoso'
import { Transaction } from "../types/transaction";
import { TransactionItem } from "./TransactionItem";
import { TransactionItemSkeleton } from "./TransactionItemSkeleton";

interface TransactionListProps {
  transactions: Transaction[];
  totalTransactions?: number;
  onTransactionClick: (transaction: Transaction) => void;
  isLoading?: boolean;
}

const PAGE_SIZE = 10;

const sortTransactions = (transactions: Transaction[]) => {
  const sortedTransactions = transactions.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
  return sortedTransactions;
};

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  totalTransactions,
  onTransactionClick,
  isLoading,
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [visibleData, setVisibleData] = useState(() =>
    sortTransactions(transactions.slice(0, PAGE_SIZE))
  );
  const page = useRef(1);


  useEffect(() => {
    // Reset pagination when transactions prop changes
    setVisibleData(sortTransactions(transactions.slice(0, PAGE_SIZE)));
    page.current = 1; // Reset page counter
  }, [transactions]);

  useEffect(() => {
    // Pre-calculate formatted amounts for display optimization
    const formattedTransactions = transactions.map((t) => {
      return {
        ...t,
        formattedAmount: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(t.amount),
      };
    });

    setSelectedItems(new Set());

    if (formattedTransactions.length > 0) {
      localStorage.setItem(
        "lastTransactionCount",
        formattedTransactions.length.toString()
      );
    }
  }, [transactions]);

  const handleItemClick = (transaction: Transaction) => {
    console.log(transaction);
    const updatedSelected = new Set(selectedItems);
    if (updatedSelected.has(transaction.id)) {
      updatedSelected.delete(transaction.id);
    } else {
      updatedSelected.add(transaction.id);
    }
    setSelectedItems(updatedSelected);

    onTransactionClick(transaction);
  };

  const handleMouseEnter = (id: string) => {
    setHoveredItem(id);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  const totalAmount = useMemo(() => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(transactions.reduce((sum, t) => sum + t.amount, 0)), [transactions]);


  const handleEndReached = () => {
    const nextPage = page.current + 1;
    const start = (nextPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const nextSlice = transactions.slice(start, end);

    if (nextSlice.length > 0) {
      setVisibleData((prev) => sortTransactions([...prev, ...nextSlice]));
      page.current = nextPage;
    }
  };

  return (
    <div
      className="transaction-list"
      role="region"
      aria-label="Transaction list"
    >
      <div className="transaction-list-header">
        <h2 id="transaction-list-title">
          Transactions ({transactions.length}
          {totalTransactions && totalTransactions !== transactions.length && (
            <span> of {totalTransactions}</span>
          )}
          )
        </h2>
        <span className="total-amount" aria-live="polite">
          Total:{" "}
          {totalAmount}
        </span>
      </div>
      {
        isLoading ? (
          <div
            className="transaction-list-container"
            role="grid"
            aria-labelledby="transaction-list-title"
            aria-rowcount={10}
            aria-busy="true"
            tabIndex={0}
          >
            {
              Array.from({ length: 10 }, (_, i) => i).map((index) => (
                <div key={`skeleton-row-${index}`} role="row">
                  <TransactionItemSkeleton
                    key={`skeleton-${index}`}
                    rowIndex={index}
                  />
                </div>
              ))
            }
          </div>
        ) : (
          visibleData.length > 0 ? (
            <div
              className="transaction-list-container"
              role="grid"
              aria-labelledby="transaction-list-title"
              aria-rowcount={visibleData.length}
              tabIndex={0}
            >
              <Virtuoso
                style={{ height: '600px' }}
                data={visibleData}
                endReached={handleEndReached}
                itemContent={(index, transaction) => (
                  <div role="row">
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      isSelected={selectedItems.has(transaction.id)}
                      isHovered={hoveredItem === transaction.id}
                      onClick={() => handleItemClick(transaction)}
                      onMouseEnter={() => handleMouseEnter(transaction.id)}
                      onMouseLeave={handleMouseLeave}
                      rowIndex={index}
                    />
                  </div>
                )}
              />
            </div>
          ) : (
            <p className="empty-transaction-message">No transactions found</p>
          )
        )
      }

    </div>
  );
};
