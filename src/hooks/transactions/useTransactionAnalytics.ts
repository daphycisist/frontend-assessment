import { useState, useEffect } from "react"
import { Transaction, TransactionAnalytics } from "../../types/transaction"
import { useWorker } from "../useWorker"

export function useTransactionAnalytics(transactions: Transaction[], filteredTransactions: Transaction[]) {
	const [isAnalyzing, setIsAnalyzing] = useState(false)
	const [riskAnalytics, setRiskAnalytics] = useState<TransactionAnalytics | null>(null)
	const { getAdvancedAnalytics } = useWorker()

	async function runAdvancedAnalytics() {
		if (filteredTransactions.length < 100) {
			return
		}

		setIsAnalyzing(true)

		const analytics = await getAdvancedAnalytics(transactions)

		setRiskAnalytics(analytics)
		setIsAnalyzing(false)
	}

	useEffect(() => {
		if (filteredTransactions.length > 500) {
			runAdvancedAnalytics()
		}
	}, [filteredTransactions])

	return { isAnalyzing, riskAnalytics }
}
