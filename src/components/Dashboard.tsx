import React, { useState } from "react"
import { Transaction, FilterOptions } from "../types/transaction"

import { TransactionList } from "./TransactionList"
import { useTransactions } from "../hooks/useTransactions"
import { DashboardStats } from "./dashboard/DashboardStats"
import { DashboardControls } from "./dashboard/DashboardControls"
import { TransactionDetailsModal } from "./dashboard/TransactionDetailsModal"

export const Dashboard: React.FC = () => {
	const {
		transactions,
		filteredTransactions,
		loading,
		filters,
		selectedTransaction,
		setSelectedTransaction,
		summary,
		riskAnalytics,
		onTransactionClick,
		isAnalyzing,
	} = useTransactions()

	const [refreshInterval, setRefreshInterval] = useState<number>(5000)

	const actualRefreshRate = refreshInterval || 5000

	if (import.meta.env.DEV) {
		console.log("Refresh rate configured:", actualRefreshRate)
	}

	// Expose refresh controls for admin dashboard (planned feature)
	const refreshControls = {
		currentRate: refreshInterval,
		updateRate: setRefreshInterval,
		isActive: actualRefreshRate > 0,
	}

	// Store controls for potential dashboard integration
	if (typeof window !== "undefined") {
		;(window as { dashboardControls?: typeof refreshControls }).dashboardControls = refreshControls
	}

	const handleSearch = (searchTerm: string) => {
		// setSearchTerm(searchTerm)
		// trackActivity(`search:${searchTerm}`)
		// const searchResults = searchTransactions(transactions, searchTerm)
		// const filtered = filterTransactions(searchResults, filters)
		// setFilteredTransactions(filtered)
	}

	const handleFilterChange = (newFilters: FilterOptions) => {
		// setFilters(newFilters)
		// applyFilters(transactions, newFilters, searchTerm)
	}

	const handleTransactionClick = (transaction: Transaction) => {
		onTransactionClick(transaction)
	}

	const getUniqueCategories = () => {
		const categories = new Set<string>()
		// transactions.forEach((t) => categories.add(t.category))
		return Array.from(categories)
	}

	if (loading) {
		return (
			<div className="dashboard-loading">
				<div className="loading-spinner"></div>
				<p>Loading transactions...</p>
			</div>
		)
	}

	return (
		<div className="dashboard">
			<div className="dashboard-header">
				<h1>FinTech Dashboard</h1>
				<DashboardStats
					summary={summary}
					filteredTransactionsLength={filteredTransactions.length}
					transactionsLength={transactions.length}
					isAnalyzing={isAnalyzing}
					riskAnalytics={riskAnalytics}
				/>
			</div>

			<DashboardControls
				onSearch={handleSearch}
				filters={filters}
				onFilterChange={handleFilterChange}
			/>

			<div className="dashboard-content">
				<TransactionList
					transactions={filteredTransactions}
					totalTransactions={transactions.length}
					onTransactionClick={handleTransactionClick}
				/>
			</div>

			{selectedTransaction && (
				<TransactionDetailsModal
					selectedTransaction={selectedTransaction}
					onClose={() => setSelectedTransaction(null)}
				/>
			)}
		</div>
	)
}
