import React from 'react';

interface TransactionItemSkeletonProps {
  rowIndex?: number;
}

export const TransactionItemSkeleton: React.FC<TransactionItemSkeletonProps> = ({
  rowIndex = 0,
}) => {
  const getSkeletonStyle = () => {
    return {
      backgroundColor: "#ffffff",
      borderLeft: "4px solid #e0e0e0",
      borderTop: "1px solid #e0e0e0",
      borderRight: "1px solid #e0e0e0",
      borderBottom: "1px solid #e0e0e0",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    };
  };

  return (
    <div
      className="transaction-item skeleton-item"
      style={getSkeletonStyle()}
      role="gridcell"
      aria-rowindex={rowIndex + 1}
      aria-busy="true"
      aria-label="Loading transaction"
      aria-selected={false}
      tabIndex={0}
    >
      <div className="transaction-main">
        <div className="transaction-merchant">
          <div className="skeleton-line skeleton-merchant-name"></div>
          <div className="skeleton-line skeleton-category"></div>
        </div>
        <div className="transaction-amount">
          <div className="skeleton-line skeleton-amount"></div>
        </div>
      </div>
      <div className="transaction-details">
        <div className="transaction-description">
          <div className="skeleton-line skeleton-description"></div>
        </div>
        <div className="transaction-meta">
          <div className="skeleton-line skeleton-date"></div>
          <div className="skeleton-line skeleton-status"></div>
          <div className="skeleton-line skeleton-location"></div>
        </div>
      </div>
    </div>
  );
};
