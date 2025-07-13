import * as React from 'react';
import { Transaction } from '../types/transaction';

type TransactionViewProps = {
  selectedTransaction: Transaction;
  setSelectedTransaction: (value: React.SetStateAction<Transaction | null>) => void
}

export const TransactionView: React.FC<TransactionViewProps> = ({ selectedTransaction, setSelectedTransaction }: TransactionViewProps) => {
  return (
    <div className="transaction-detail-modal">
      <div className="modal-content">
        <h3>Transaction Details</h3>
        <div className="transaction-details">
          <p>
            <strong>ID:</strong> {selectedTransaction.id}
          </p>
          <p>
            <strong>Merchant:</strong> {selectedTransaction.merchantName}
          </p>
          <p>
            <strong>Amount:</strong> ${selectedTransaction.amount.toLocaleString()}
          </p>
          <p>
            <strong>Category:</strong> {selectedTransaction.category}
          </p>
          <p>
            <strong>Status:</strong> {selectedTransaction.status}
          </p>
          <p>
            <strong>Date:</strong>{" "}
            {selectedTransaction.timestamp.toLocaleString()}
          </p>
        </div>

        <div className='transaction-view-button-container'>
          <button role='botton' aria-description='close preview' onClick={() => setSelectedTransaction(null)}>Close</button>
          <button role='botton' aria-description='Export' onClick={() => setSelectedTransaction(null)}>Export</button>
        </div>
      </div>
    </div>
  );
}