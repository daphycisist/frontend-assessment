import React, { useState, useEffect, useMemo } from 'react';
import { FixedSizeList as RWFixedSizeList, ListChildComponentProps } from 'react-window';

// Workaround for typing issue with react-window + React 18 JSX
const FixedSizeList = RWFixedSizeList as unknown as React.ComponentType<unknown> &
  typeof RWFixedSizeList;
import { Transaction } from '../types/transaction';
import { TransactionItem } from './TransactionItem';

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
    // store count for dev debugging, only when list length changes
    localStorage.setItem('lastTransactionCount', transactions.length.toString());
    setSelectedItems(new Set());
  }, [transactions.length]);

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

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [transactions]);

  // Row renderer for react-window
  const Row = ({ index, style }: ListChildComponentProps) => {
    const transaction = sortedTransactions[index];
    return (
      <div style={style}>
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
    );
  };

  return (
    <div
      className="transaction-list"
      role="region"
      aria-label="Transaction list"
      aria-keyshortcuts="ArrowUp ArrowDown Enter"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHoveredItem((prev) => {
            const currentIndex = sortedTransactions.findIndex((t) => t.id === prev);
            const nextIndex = Math.min(currentIndex + 1, sortedTransactions.length - 1);
            return sortedTransactions[nextIndex]?.id ?? prev;
          });
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHoveredItem((prev) => {
            const currentIndex = sortedTransactions.findIndex((t) => t.id === prev);
            const prevIndex = Math.max(currentIndex - 1, 0);
            return sortedTransactions[prevIndex]?.id ?? prev;
          });
        }
        if (e.key === 'Enter') {
          const current = sortedTransactions.find((t) => t.id === hoveredItem);
          if (current) onTransactionClick(current);
        }
      }}
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
          Total:{' '}
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(transactions.reduce((sum, t) => sum + t.amount, 0))}
        </span>
      </div>

      <div
        className="transaction-list-container"
        role="grid"
        aria-labelledby="transaction-list-title"
        aria-rowcount={sortedTransactions.length}
        tabIndex={0}
      >
        <FixedSizeList
          height={600}
          itemCount={sortedTransactions.length}
          itemSize={200}
          width="100%"
        >
          {Row}
        </FixedSizeList>
      </div>
    </div>
  );
};
