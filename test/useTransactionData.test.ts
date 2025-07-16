import { renderHook, waitFor } from "@testing-library/react"
import { act } from "react"
import { useTransactionData } from "../src/hooks/transactions/useTransactionData"
import { useWorker } from "../src/hooks/useWorker"
import { useUserContext } from "../src/hooks/useUserContext"
import { Transaction } from "../src/types/transaction"

vi.mock("../src/hooks/useWorker")
vi.mock("../src/hooks/useUserContext")

describe("useTransactionData", () => {
	const mockGenerateTransactionData = vi.fn()
	const mockCalculateSummary = vi.fn()
	const mockGetFilteredTransactions = vi.fn()
	const mockUpdateUserPreferences = vi.fn()

	const mockTransactions: Transaction[] = [
		{
			id: "1",
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
		},
	]

	beforeEach(() => {
		vi.clearAllMocks()
		;(useWorker as jest.Mock).mockReturnValue({
			generateTransactionData: mockGenerateTransactionData,
			calculateSummary: mockCalculateSummary,
			getFilteredTransactions: mockGetFilteredTransactions,
			generateRiskAssessment: vi.fn(),
			searchTransactions: vi.fn(),
		})
		;(useUserContext as jest.Mock).mockReturnValue({
			userPreferences: { theme: "light" },
			updateUserPreferences: mockUpdateUserPreferences,
		})

		mockGenerateTransactionData.mockResolvedValue(mockTransactions)
		mockCalculateSummary.mockResolvedValue({ total: 300, credits: 100, debits: 200 })

		// Make the mock for getFilteredTransactions more realistic
		mockGetFilteredTransactions.mockImplementation(
			async (transactions: Transaction[], filters: any) => {
				if (filters.type === "credit") {
					return transactions.filter((t) => t.type === "credit")
				}
				if (filters.type === "debit") {
					return transactions.filter((t) => t.type === "debit")
				}
				return transactions
			}
		)
	})

	it("should load initial data and set summary", async () => {
		const { result } = renderHook(() => useTransactionData())

		expect(result.current.loading).toBe(true)

		await waitFor(() => {
			expect(result.current.loading).toBe(false)
		})

		expect(result.current.transactions).toEqual(mockTransactions)
		expect(result.current.summary).toEqual({ total: 300, credits: 100, debits: 200 })
		// Initial call to applyFilters
		expect(mockGetFilteredTransactions).toHaveBeenCalledWith(
			mockTransactions,
			expect.any(Object),
			expect.any(Object)
		)
	})

	it("should filter transactions when setFilters is called", async () => {
		const { result } = renderHook(() => useTransactionData())

		await waitFor(() => {
			expect(result.current.loading).toBe(false)
		})

		act(() => {
			result.current.setFilters({ type: "credit" })
		})

		await waitFor(() => {
			expect(result.current.filters).toEqual({ type: "credit" })
			expect(result.current.filteredTransactions).toEqual([mockTransactions[0]])
		})
	})

	it("should clear filters and reset filtered transactions", async () => {
		const { result } = renderHook(() => useTransactionData())

		await waitFor(() => {
			expect(result.current.loading).toBe(false)
		})

		act(() => {
			result.current.setFilters({ type: "credit" })
		})

		await waitFor(() => {
			expect(result.current.filteredTransactions).toEqual([mockTransactions[0]])
		})

		act(() => {
			result.current.clearFilters()
		})

		await waitFor(() => {
			expect(result.current.filters).toEqual({
				type: "all",
				status: "all",
				category: "",
				searchTerm: "",
			})
			expect(result.current.filteredTransactions).toEqual(mockTransactions)
		})
	})
})
