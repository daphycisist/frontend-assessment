import React, { useState, useEffect, useMemo } from 'react';
import { FixedSizeList as RWFixedSizeList, ListChildComponentProps } from 'react-window';

// Workaround for typing issue with react-window + React 18 JSX
const FixedSizeList = RWFixedSizeList as unknown as React.ComponentType<unknown> &
  typeof RWFixedSizeList;
import { Transaction } from '../types/transaction';
import { TxType } from '../constants/transactions';
import { format } from 'date-fns';

interface TransactionListProps {
  transactions: Transaction[];
  totalTransactions?: number;
  onTransactionClick: (transaction: Transaction) => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const formatCurrency = (amount: number) => currencyFormatter.format(amount);

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

const TransactionItem: React.FC<{
  transaction: Transaction;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  rowIndex: number;
}> = ({ transaction, isSelected, isHovered, onClick, onMouseEnter, onMouseLeave, rowIndex }) => {
  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy HH:mm');
  };

  const getItemStyle = () => {
    const accentColor =
      transaction.type === TxType.Debit ? 'var(--accent-negative)' : 'var(--accent-positive)';

    const base = {
      backgroundColor: 'var(--card-bg)',
      borderRadius: '8px',
      border: '1px solid var(--card-border)',
      borderLeft: `4px solid ${accentColor}`,
      padding: '16px',
      marginBottom: '12px',
    } as React.CSSProperties;

    if (isHovered || isSelected) {
      return {
        ...base,
        border: `2px solid var(--primary)`,
        borderLeft: `4px solid var(--primary)`,
        padding: '15px', // compensate 1px delta each side
      };
    }

    return base;
  };

  return (
    <div
      className="transaction-item"
      style={getItemStyle()}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="gridcell"
      aria-rowindex={rowIndex + 1}
      aria-selected={isSelected}
      aria-describedby={`transaction-${transaction.id}-details`}
      tabIndex={0}
    >
      <div className="transaction-main">
        <div className="transaction-merchant">
          <span className="merchant-name">{transaction.merchantName}</span>
          <span className="transaction-category">{transaction.category}</span>
        </div>
        <div className="transaction-amount">
          <span className={`amount ${transaction.type}`}>
            {transaction.type === 'debit' ? '-' : '+'}
            {formatCurrency(transaction.amount)}
          </span>
        </div>
      </div>
      <div className="transaction-details" id={`transaction-${transaction.id}-details`}>
        <div
          className="transaction-description"
          aria-label={`Description: ${transaction.description}`}
        >
          {transaction.description}
        </div>
        <div className="transaction-meta">
          <span
            className="transaction-date"
            aria-label={`Date: ${formatDate(transaction.timestamp)}`}
          >
            {formatDate(transaction.timestamp)}
          </span>
          <span
            className={`transaction-status ${transaction.status}`}
            aria-label={`Status: ${transaction.status}`}
            aria-live="polite"
          >
            {transaction.status}
          </span>
          <span
            className="transaction-location"
            aria-label={`Location: ${transaction.location ?? 'N/A'}`}
          >
            {transaction.location ?? 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};
