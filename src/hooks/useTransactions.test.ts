import { renderHook, act } from "@testing-library/react"
import { useTransactions } from "./useTransactions"
import { useUserContext } from "./useUserContext"
import { useTransactionData } from "./transactions/useTransactionData"
import { useTransactionAnalytics } from "./transactions/useTransactionAnalytics"
import { Transaction } from "../types/transaction"

vi.mock("./useUserContext")
vi.mock("./transactions/useTransactionData")
vi.mock("./transactions/useTransactionAnalytics")

describe("useTransactions", () => {
	const mockUpdateUserPreferences = vi.fn()

	beforeEach(() => {
		;(useUserContext as jest.Mock).mockReturnValue({
			updateUserPreferences: mockUpdateUserPreferences,
		})
		;(useTransactionData as jest.Mock).mockReturnValue({
			transactions: [],
			summary: { total: 0, credits: 0, debits: 0 },
			setSummary: vi.fn(),
			loading: false,
			filteredTransactions: [],
			filters: { searchTerm: "" },
			setFilters: vi.fn(),
			clearFilters: vi.fn(),
		})
		;(useTransactionAnalytics as jest.Mock).mockReturnValue({
			isAnalyzing: false,
			riskAnalytics: { riskScore: 0 },
		})
	})

	it("should return the initial state", () => {
		const { result } = renderHook(() => useTransactions())

		expect(result.current.transactions).toEqual([])
		expect(result.current.filteredTransactions).toEqual([])
		expect(result.current.selectedTransaction).toBeNull()
		expect(result.current.filters).toEqual({ searchTerm: "" })
		expect(result.current.summary).toEqual({ total: 0, credits: 0, debits: 0 })
		expect(result.current.loading).toBe(false)
		expect(result.current.riskAnalytics).toEqual({ riskScore: 0 })
		expect(result.current.isAnalyzing).toBe(false)
	})

	it("should handle transaction click", () => {
		const { result } = renderHook(() => useTransactions())

		const mockTransaction: Transaction = {
			id: "2",
			timestamp: new Date(),
			amount: 200,
			currency: "USD",
			type: "debit",
			category: "Travel",
			description: "Flight Booking",
			merchantName: "Airline B",
			status: "completed",
			userId: "user1",
			accountId: "account1",
		}

		act(() => {
			result.current.onTransactionClick(mockTransaction)
		})

		expect(result.current.selectedTransaction).toEqual(mockTransaction)
		expect(mockUpdateUserPreferences).toHaveBeenCalled()
	})
})
