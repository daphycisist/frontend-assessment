import React from 'react';
import { Transaction } from '../types/transaction';

interface TransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, onClose }) => {
  return (
    <div className="transaction-detail-modal" role="dialog" aria-modal="true">
      <div className="modal-content">
        <h3>Transaction Details</h3>
        <div className="transaction-details">
          <p>
            <strong>ID:</strong> {transaction.id}
          </p>
          <p>
            <strong>Merchant:</strong> {transaction.merchantName}
          </p>
          <p>
            <strong>Amount:</strong> ${transaction.amount}
          </p>
          <p>
            <strong>Category:</strong> {transaction.category}
          </p>
          <p>
            <strong>Status:</strong> {transaction.status}
          </p>
          <p>
            <strong>Date:</strong> {transaction.timestamp.toLocaleString()}
          </p>
        </div>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
