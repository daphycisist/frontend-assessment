import { DollarSign, TrendingUp, TrendingDown, Clock } from "lucide-react"
import { TransactionSummary } from "../../types/transaction"

interface DashboardStatsProps {
	summary: TransactionSummary | null
	filteredTransactionsLength: number
	transactionsLength: number
	isAnalyzing: boolean
	riskAnalytics: { highRiskTransactions: number } | null
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ summary, filteredTransactionsLength, transactionsLength, isAnalyzing, riskAnalytics }) => {
	return (
		<div className="dashboard-stats">
			<div className="stat-card">
				<div className="stat-icon">
					<DollarSign size={24} />
				</div>
				<div className="stat-content">
					<div className="stat-value">
						${summary ? summary.totalAmount.toLocaleString() : "0"}
					</div>
					<div className="stat-label">Total Amount</div>
				</div>
			</div>

			<div className="stat-card">
				<div className="stat-icon">
					<TrendingUp size={24} />
				</div>
				<div className="stat-content">
					<div className="stat-value">
						${summary ? summary.totalCredits.toLocaleString() : "0"}
					</div>
					<div className="stat-label">Total Credits</div>
				</div>
			</div>

			<div className="stat-card">
				<div className="stat-icon">
					<TrendingDown size={24} />
				</div>
				<div className="stat-content">
					<div className="stat-value">
						${summary ? summary.totalDebits.toLocaleString() : "0"}
					</div>
					<div className="stat-label">Total Debits</div>
				</div>
			</div>

			<div className="stat-card">
				<div className="stat-icon">
					<Clock size={24} />
				</div>
				<div className="stat-content">
					<div className="stat-value">
						{filteredTransactionsLength.toLocaleString()}
						{filteredTransactionsLength !== transactionsLength && (
							<span className="stat-total"> of {transactionsLength.toLocaleString()}</span>
						)}
					</div>
					<div className="stat-label">
						Transactions
						{isAnalyzing && <span> (Analyzing...)</span>}
						{riskAnalytics && <span> - Risk: {riskAnalytics.highRiskTransactions}</span>}
					</div>
				</div>
			</div>
		</div>
	)
}
