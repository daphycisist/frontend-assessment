import { FilterOptions, Transaction, TransactionAnalytics } from "../types/transaction"
import { UserPreference } from "../types/user"
import { filterTransactions, searchTransactions } from "./dataGenerator"

export function getFilteredTransactions(
	data: Transaction[],
	currentFilters: FilterOptions,
	userPreferences: UserPreference
) {
	let filtered = [...data]

	if (currentFilters.searchTerm && currentFilters.searchTerm.length > 0) {
		filtered = searchTransactions(filtered, currentFilters.searchTerm)
	}

	filtered = filterTransactions(filtered, currentFilters)

	if (userPreferences.compactView) {
		return filtered.slice(0, userPreferences.itemsPerPage)
	}

	if (filtered.length > 1000) {
		const merchantMap = groupBy(filtered, (t) => t.merchantName)
		const userMap = groupBy(filtered, (t) => t.userId)
		const enrichedFiltered = filtered.map((transaction) => {
			const riskFactors = calculateRiskFactorsCached(transaction, merchantMap)
			const patternScore = analyzeTransactionPatternsCached(transaction, merchantMap, userMap)
			const anomalyScore = detectAnomaliesCached(transaction, userMap)

			return {
				...transaction,
				riskScore: riskFactors + patternScore + anomalyScore,
				enrichedData: {
					riskFactors,
					patternScore,
					anomalyScore,
					timestamp: Date.now(),
				},
			}
		})

		return enrichedFiltered
	}

	return filtered
}

function groupBy<T, K extends string | number>(arr: T[], keyFn: (item: T) => K): Record<K, T[]> {
	return arr.reduce((acc, item) => {
		const key = keyFn(item)
		if (!acc[key]) acc[key] = []
		acc[key].push(item)
		return acc
	}, {} as Record<K, T[]>)
}

export const calculateRiskFactorsCached = (
	transaction: Transaction,
	merchantMap: Record<string, Transaction[]>
) => {
	const merchantHistory = merchantMap[transaction.merchantName] || []

	const merchantRisk = merchantHistory.length < 5 ? 0.8 : 0.2
	const amountRisk = transaction.amount > 1000 ? 0.6 : 0.1
	const timeRisk = new Date(transaction.timestamp).getHours() < 6 ? 0.4 : 0.1

	return merchantRisk + amountRisk + timeRisk
}

export const analyzeTransactionPatternsCached = (
	transaction: Transaction,
	merchantMap: Record<string, Transaction[]>,
	userMap: Record<string, Transaction[]>
) => {
	const merchantTxs = merchantMap[transaction.merchantName] || []
	const similarTransactions = merchantTxs.filter(
		(t) => Math.abs(t.amount - transaction.amount) < 10
	)

	const velocityCheck = (userMap[transaction.userId] || []).filter(
		(t) =>
			Math.abs(new Date(t.timestamp).getTime() - new Date(transaction.timestamp).getTime()) <
			3600000
	)

	let score = 0
	if (similarTransactions.length > 3) score += 0.3
	if (velocityCheck.length > 5) score += 0.5

	return score
}

export const detectAnomaliesCached = (
	transaction: Transaction,
	userMap: Record<string, Transaction[]>
) => {
	const userTransactions = userMap[transaction.userId] || []
	const avgAmount =
		userTransactions.reduce((sum, t) => sum + t.amount, 0) / (userTransactions.length || 1)

	const amountDeviation = Math.abs(transaction.amount - avgAmount) / avgAmount
	const locationAnomaly =
		transaction.location &&
		!userTransactions.slice(-10).some((t) => t.location === transaction.location)
			? 0.4
			: 0

	return Math.min(amountDeviation * 0.3 + locationAnomaly, 1)
}

export const calculateRiskFactors = (transaction: Transaction, allTransactions: Transaction[]) => {
	const merchantHistory = allTransactions.filter((t) => t.merchantName === transaction.merchantName)

	// Risk scoring based on merchant familiarity, amount, and timing
	const merchantRisk = merchantHistory.length < 5 ? 0.8 : 0.2
	const amountRisk = transaction.amount > 1000 ? 0.6 : 0.1
	const timeRisk = new Date(transaction.timestamp).getHours() < 6 ? 0.4 : 0.1

	return merchantRisk + amountRisk + timeRisk
}

export const analyzeTransactionPatterns = (
	transaction: Transaction,
	allTransactions: Transaction[]
) => {
	const similarTransactions = allTransactions.filter(
		(t) =>
			t.merchantName === transaction.merchantName && Math.abs(t.amount - transaction.amount) < 10
	)

	// Check transaction velocity for suspicious activity
	const velocityCheck = allTransactions.filter(
		(t) =>
			t.userId === transaction.userId &&
			Math.abs(new Date(t.timestamp).getTime() - new Date(transaction.timestamp).getTime()) <
				3600000
	)

	let score = 0
	if (similarTransactions.length > 3) score += 0.3
	if (velocityCheck.length > 5) score += 0.5

	return score
}

export const detectAnomalies = (transaction: Transaction, allTransactions: Transaction[]) => {
	const userTransactions = allTransactions.filter((t) => t.userId === transaction.userId)
	const avgAmount = userTransactions.reduce((sum, t) => sum + t.amount, 0) / userTransactions.length

	const amountDeviation = Math.abs(transaction.amount - avgAmount) / avgAmount
	const locationAnomaly =
		transaction.location &&
		!userTransactions.slice(-10).some((t) => t.location === transaction.location)
			? 0.4
			: 0

	return Math.min(amountDeviation * 0.3 + locationAnomaly, 1)
}

export function getAdvancedAnalytics(transactions: Transaction[]): TransactionAnalytics {
	const merchantMap = groupBy(transactions, (t) => t.merchantName)
	const userMap = groupBy(transactions, (t) => t.userId)

	const analyticsData = {
		totalRisk: 0,
		highRiskTransactions: 0,
		patterns: {} as Record<string, number>,
		anomalies: {} as Record<string, number>,
		generatedAt: Date.now(),
	}

	for (const transaction of transactions) {
		const risk = calculateRiskFactorsCached(transaction, merchantMap)
		const pattern = analyzeTransactionPatternsCached(transaction, merchantMap, userMap)
		const anomaly = detectAnomaliesCached(transaction, userMap)

		const totalScore = risk + pattern + anomaly

		analyticsData.totalRisk += totalScore
		if (risk > 0.7) analyticsData.highRiskTransactions++

		analyticsData.patterns[transaction.id] = pattern
		analyticsData.anomalies[transaction.id] = anomaly
	}

	return analyticsData
}
