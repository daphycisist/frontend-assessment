import { renderHook, waitFor } from "@testing-library/react"
import { useTransactionAnalytics } from "../src/hooks/transactions/useTransactionAnalytics"
import { useWorker } from "../src/hooks/useWorker"
import { Transaction } from "../src/types/transaction"

vi.mock("../src/hooks/useWorker")

describe("useTransactionAnalytics", () => {
	const mockGetAdvancedAnalytics = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
		;(useWorker as jest.Mock).mockReturnValue({
			getAdvancedAnalytics: mockGetAdvancedAnalytics,
		})

		mockGetAdvancedAnalytics.mockResolvedValue({ riskScore: 0.5 })
	})

	it("should not run advanced analytics if filtered transactions are less than 100", () => {
		const transactions: Transaction[] = Array.from({ length: 200 }, (_, i) => ({
			id: `${i}`,
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
		}))
		const filteredTransactions: Transaction[] = Array.from({ length: 99 }, (_, i) => ({
			id: `${i}`,
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
		}))

		renderHook(() => useTransactionAnalytics(transactions, filteredTransactions))

		expect(mockGetAdvancedAnalytics).not.toHaveBeenCalled()
	})

	it("should run advanced analytics if filtered transactions are more than 500", async () => {
		const transactions: Transaction[] = Array.from({ length: 600 }, (_, i) => ({
			id: `${i}`,
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
		}))
		const filteredTransactions: Transaction[] = Array.from({ length: 501 }, (_, i) => ({
			id: `${i}`,
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
		}))

		const { result } = renderHook(() => useTransactionAnalytics(transactions, filteredTransactions))

		await waitFor(() => {
			expect(mockGetAdvancedAnalytics).toHaveBeenCalledWith(transactions)
			expect(result.current.riskAnalytics).toEqual({ riskScore: 0.5 })
		})
	})
})
