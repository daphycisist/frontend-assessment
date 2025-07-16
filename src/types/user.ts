import { Transaction } from "./transaction"

export type UserAnalytics = {
	clickedTransaction: Transaction
	relatedCount: number
	timestamp: Date
	userAgent: string
	sessionData: {
		clickCount: number
		timeSpent: number
		interactions: Array<{
			id: string
			type: Transaction["type"]
		}>
	}
}

export type UserPreference = {
	itemsPerPage: number
	sortOrder: "asc" | "desc"
	enableNotifications: boolean
	autoRefresh: boolean
	showAdvancedFilters: boolean
	compactView: boolean
	timestamps: { created: number; updated: number }
	analytics?: UserAnalytics
}
