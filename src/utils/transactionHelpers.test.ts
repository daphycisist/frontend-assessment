import {
	getFilteredTransactions,
	calculateRiskFactors,
	analyzeTransactionPatterns,
	detectAnomalies,
	getAdvancedAnalytics,
} from "./transactionHelpers"
import { Transaction } from "../types/transaction"
import * as dataGenerator from "./dataGenerator"
import { UserPreference } from "../types/user"

vi.mock("./dataGenerator", () => ({
	filterTransactions: vi.fn((data) => data),
	searchTransactions: vi.fn((data) => data),
}))

describe("transactionHelpers", () => {
	const mockTransactions: Transaction[] = [
		{
			id: `1`,
			timestamp: new Date(),
			amount: 10000,
			currency: "USD",
			type: "credit",
			category: "Shopping",
			description: "Purchase at Store A",
			merchantName: "Store A",
			status: "completed",
			userId: "user1",
			accountId: "account1",
		},
		{
			id: `2`,
			timestamp: new Date(),
			amount: 100,
			currency: "USD",
			type: "credit",
			category: "Shopping",
			description: "Purchase at Store A",
			merchantName: "Store A",
			status: "completed",
			userId: "user1",
			accountId: "account1",
		},
		{
			id: `3`,
			timestamp: new Date(),
			amount: 100,
			currency: "USD",
			type: "credit",
			category: "Shopping",
			description: "Purchase at Store A",
			merchantName: "Store A",
			status: "completed",
			userId: "user1",
			accountId: "account1",
		},
	]

	describe("getFilteredTransactions", () => {
		it("should call searchTransactions and filterTransactions", () => {
			getFilteredTransactions(mockTransactions, { searchTerm: "test" }, {})
			expect(dataGenerator.searchTransactions).toHaveBeenCalledWith(mockTransactions, "test")
			expect(dataGenerator.filterTransactions).toHaveBeenCalled()
		})

		it("should apply compact view settings", () => {
			const result = getFilteredTransactions(mockTransactions, {}, {
				compactView: true,
				itemsPerPage: 1,
			} as UserPreference)
			expect(result).toHaveLength(1)
		})
	})

	describe("calculateRiskFactors", () => {
		it("should calculate a risk score", () => {
			const risk = calculateRiskFactors(mockTransactions[0], mockTransactions)
			expect(risk).toBeGreaterThan(0)
		})
	})

	describe("analyzeTransactionPatterns", () => {
		it("should analyze transaction patterns and return a score", () => {
			const score = analyzeTransactionPatterns(mockTransactions[0], mockTransactions)
			expect(score).toBe(0)
		})
	})

	describe("detectAnomalies", () => {
		it("should detect anomalies and return a score", () => {
			const score = detectAnomalies(mockTransactions[0], mockTransactions)
			expect(score).toBeGreaterThan(0)
		})
	})

	describe("getAdvancedAnalytics", () => {
		it("should generate advanced analytics data", () => {
			const analytics = getAdvancedAnalytics(mockTransactions)
			expect(analytics.totalRisk).toBeGreaterThan(0)
			expect(analytics.highRiskTransactions).toBeDefined()
			expect(analytics.patterns).toBeDefined()
			expect(analytics.anomalies).toBeDefined()
		})
	})
})
