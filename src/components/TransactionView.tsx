import { useEffect, useRef } from 'react';
import { Transaction } from '../types/transaction';

type TransactionViewProps = {
  selectedTransaction: Transaction;
  handleCloseTransactionView: () => void
}

export const TransactionView: React.FC<TransactionViewProps> = ({ selectedTransaction, handleCloseTransactionView }: TransactionViewProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    modalRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseTransactionView();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleCloseTransactionView])
  
  return (
    <div 
    role="dialog"
    aria-label={`Transaction details for ${selectedTransaction.id}`}
    onKeyDown={(e) => {
      if (e.key === "Escape" || e.key === "Enter") handleCloseTransactionView();
    }}
    className="transaction-detail-modal">
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
          <button role='botton' aria-label="Close transaction details" onClick={handleCloseTransactionView}>Close</button>
          <button role='botton' aria-description='Export' onClick={() => handleCloseTransactionView()}>Export</button>
        </div>
      </div>
    </div>
  );
}