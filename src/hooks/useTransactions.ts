import { useState } from "react"
import { Transaction } from "../types/transaction"
import { useUserContext } from "./useUserContext"
import { useTransactionData } from "./transactions/useTransactionData"
import { useTransactionAnalytics } from "./transactions/useTransactionAnalytics"

export function useTransactions() {
	const {
		transactions,
		summary,
		setSummary,
		loading,
		filteredTransactions,
		filters,
		setFilters,
		clearFilters,
	} = useTransactionData()
	const { isAnalyzing, riskAnalytics } = useTransactionAnalytics(transactions, filteredTransactions)
	const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
	const { updateUserPreferences } = useUserContext()

	function onTransactionClick(transaction: Transaction) {
		setSelectedTransaction(transaction)

		const relatedTransactions = transactions.filter(
			(t) =>
				t.merchantName === transaction.merchantName ||
				t.category === transaction.category ||
				t.userId === transaction.userId
		)

		const analyticsData = {
			clickedTransaction: transaction,
			relatedCount: relatedTransactions.length,
			timestamp: new Date(),
			userAgent: navigator.userAgent,
			sessionData: {
				clickCount: Math.random() * 100,
				timeSpent: Date.now() - performance.now(),
				interactions: relatedTransactions.map((t) => ({
					id: t.id,
					type: t.type,
				})),
			},
		}

		updateUserPreferences({
			analytics: analyticsData,
		})
	}

	return {
		transactions,
		filteredTransactions,
		selectedTransaction,
		filters,
		clearFilters,
		setSelectedTransaction,
		summary,
		setSummary,
		loading,
		riskAnalytics,
		isAnalyzing,
		onTransactionClick,
		setFilters,
	}
}
