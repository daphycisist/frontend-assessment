import React from 'react';
import { Transaction } from '../types/transaction';
import { TxType } from '../constants/transactions';
import { format } from 'date-fns';

interface TransactionItemProps {
  transaction: Transaction;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  rowIndex: number;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const formatCurrency = (amount: number) => currencyFormatter.format(amount);

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  rowIndex,
}) => {
  const formatDate = (date: Date) => format(date, 'MMM dd, yyyy HH:mm');

  const accentColor =
    transaction.type === TxType.Debit ? 'var(--accent-negative)' : 'var(--accent-positive)';

  const base: React.CSSProperties = {
    backgroundColor: 'var(--card-bg)',
    borderRadius: '8px',
    border: '1px solid var(--card-border)',
    borderLeft: `4px solid ${accentColor}`,
    padding: '16px',
    marginBottom: '12px',
  };

  const style: React.CSSProperties =
    isHovered || isSelected
      ? {
          ...base,
          border: '2px solid var(--primary)',
          borderLeft: '4px solid var(--primary)',
          padding: '15px',
        }
      : base;

  return (
    <div
      className="transaction-item"
      style={style}
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
  );
};
