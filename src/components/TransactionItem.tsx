import React from 'react'
import { format } from "date-fns";

import { Transaction } from '../types/transaction';

export const TransactionItem: React.FC<{
    transaction: Transaction;
    isSelected: boolean;
    isHovered: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    rowIndex: number;
  }> = ({
    transaction,
    isSelected,
    isHovered,
    onClick,
    onMouseEnter,
    onMouseLeave,
    rowIndex,
  }) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    };
  
    const formatDate = (date: Date) => {
      return format(date, "MMM dd, yyyy HH:mm");
    };
  
    const getItemStyle = () => {
      const baseStyle = {
        backgroundColor: isSelected ? "#e3f2fd" : "#ffffff",
        transform: isHovered ? "translateY(-1px)" : "translateY(0)",
        boxShadow: isHovered
          ? "0 4px 8px rgba(0,0,0,0.1)"
          : "0 2px 4px rgba(0,0,0,0.05)",
        borderTop: isHovered ? "1px solid #2196f3" : "1px solid #e0e0e0",
        borderRight: isHovered ? "1px solid #2196f3" : "1px solid #e0e0e0",
        borderBottom: isHovered ? "1px solid #2196f3" : "1px solid #e0e0e0",
      };

      switch (transaction.type) {
        case 'credit':
          return {
            ...baseStyle,
            borderLeft: "4px solid #4caf50",
          };
        case 'debit':
          return {
            ...baseStyle,
            borderLeft: "4px solid #f44336",
          }
        default:
          break;
      }
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
              {transaction.type === "debit" ? "-" : "+"}
              {formatCurrency(transaction.amount)}
            </span>
          </div>
        </div>
        <div
          className="transaction-details"
          id={`transaction-${transaction.id}-details`}
        >
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
            {transaction.location && (
              <span
                className="transaction-location"
                aria-label={`Location: ${transaction.location}`}
              >
                {transaction.location}
              </span>
            )}
            <span
              className={`transaction-status ${transaction.status}`}
              aria-label={`Status: ${transaction.status}`}
              aria-live="polite"
            >
              {transaction.status}
            </span>
          </div>
        </div>
      </div>
    );
  };
  