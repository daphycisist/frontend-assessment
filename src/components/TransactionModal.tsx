import React from 'react';
import { Transaction } from '../types/transaction';
import FocusLock from 'react-focus-lock';

interface TransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, onClose }) => {
  return (
    <div className="transaction-detail-modal" role="dialog" aria-modal="true">
      <FocusLock returnFocus>
        <div
          className="modal-content"
          style={{ background: 'var(--card-bg)', color: 'var(--text)' }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
          }}
        >
          <h3>Transaction Details</h3>
          <dl className="details-list">
            <dt>ID</dt>
            <dd>{transaction.id}</dd>
            <dt>Merchant</dt>
            <dd>{transaction.merchantName}</dd>
            <dt>Amount</dt>
            <dd>
              {transaction.type === 'debit' ? '-' : '+'}${transaction.amount.toLocaleString()}
            </dd>
            <dt>Category</dt>
            <dd>{transaction.category}</dd>
            <dt>Status</dt>
            <dd style={{ textTransform: 'capitalize' }}>{transaction.status}</dd>
            <dt>Date</dt>
            <dd>{transaction.timestamp.toLocaleString()}</dd>
            {transaction.location && (
              <>
                <dt>Location</dt>
                <dd>{transaction.location}</dd>
              </>
            )}
          </dl>
          <button
            onClick={onClose}
            style={{
              marginTop: '1.5rem',
              alignSelf: 'flex-start',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </FocusLock>
    </div>
  );
};
