import React, { useState, useEffect, useMemo } from "react";
import { Virtuoso } from 'react-virtuoso'
import { Transaction } from "../types/transaction";
import { TransactionItem } from "./TransactionItem";

interface TransactionListProps {
  transactions: Transaction[];
  totalTransactions?: number;
  onTransactionClick: (transaction: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  totalTransactions,
  onTransactionClick,
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

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

  const sortedTransactions = transactions.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const totalAmount = useMemo(() => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(transactions.reduce((sum, t) => sum + t.amount, 0)), [transactions]);


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
        sortedTransactions.length > 0 ? (
          <div
            className="transaction-list-container"
            role="grid"
            aria-labelledby="transaction-list-title"
            aria-rowcount={sortedTransactions.length}
            tabIndex={0}
          >
            <Virtuoso
              style={{ height: '600px' }}
              data={sortedTransactions}
              itemContent={(index, transaction) => (
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
              )}
            />
          </div>
        ) : (
          <p>No transactions found</p>
        )
      }

    </div>
  );
};
