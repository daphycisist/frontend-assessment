import { renderHook } from "@testing-library/react"
import { useWorker } from "./useWorker"
import * as client from "../workers/client"
import { UserPreference } from "../types/user"

vi.mock("../workers/client", () => ({
	call: vi.fn(),
}))

describe("useWorker", () => {
	it("should call the worker with the correct parameters", async () => {
		const { result } = renderHook(() => useWorker())

		await result.current.generateRiskAssessment([])
		expect(client.call).toHaveBeenCalledWith("generateRiskAssessment", [[]])

		await result.current.getAdvancedAnalytics([])
		expect(client.call).toHaveBeenCalledWith("getAdvancedAnalytics", [[]])

		await result.current.generateTransactionData(100)
		expect(client.call).toHaveBeenCalledWith("generateTransactionData", [100])

		await result.current.calculateSummary([])
		expect(client.call).toHaveBeenCalledWith("calculateSummary", [[]])

		await result.current.searchTransactions([], "test")
		expect(client.call).toHaveBeenCalledWith("searchTransactions", [[], "test"])

		await result.current.getFilteredTransactions([], {}, {} as UserPreference)
		expect(client.call).toHaveBeenCalledWith("getFilteredTransactions", [[], {}, {}])
	})
})
