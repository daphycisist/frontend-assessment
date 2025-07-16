import { Transaction } from "../../types/transaction"

interface TransactionDetailsModalProps {
	selectedTransaction: Transaction
	onClose: () => void
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({ selectedTransaction, onClose }) => {
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
						<strong>Amount:</strong> ${selectedTransaction.amount}
					</p>
					<p>
						<strong>Category:</strong> {selectedTransaction.category}
					</p>
					<p>
						<strong>Status:</strong> {selectedTransaction.status}
					</p>
					<p>
						<strong>Date:</strong> {selectedTransaction.timestamp.toLocaleString()}
					</p>
				</div>
				<button onClick={onClose}>Close</button>
			</div>
		</div>
	)
}
