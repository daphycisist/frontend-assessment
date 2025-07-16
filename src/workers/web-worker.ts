import { generateRiskAssessment } from "../utils/analyticsEngine"
import {
	calculateSummary,
	generateTransactionData,
	searchTransactions,
} from "../utils/dataGenerator"
import { getAdvancedAnalytics, getFilteredTransactions } from "../utils/transactionHelpers"
import type { WorkerCall, WorkerMethodParams, WorkerResult } from "./types"

self.onmessage = (event: MessageEvent<WorkerCall<any>>) => {
	const { callId, method, parameters } = event.data

	let workerResult: WorkerResult

	const now = performance.now()
	switch (method) {
		case "generateRiskAssessment": {
			const methodResult = generateRiskAssessment(
				...(parameters as WorkerMethodParams<"generateRiskAssessment">)
			)

			workerResult = {
				callId,
				result: methodResult,
			}

			break
		}
		case "getAdvancedAnalytics": {
			const analyticsResult = getAdvancedAnalytics(
				...(parameters as WorkerMethodParams<"getAdvancedAnalytics">)
			)

			workerResult = {
				callId,
				result: analyticsResult,
			}

			break
		}
		case "generateTransactionData": {
			const transactionData = generateTransactionData(
				...(parameters as WorkerMethodParams<"generateTransactionData">)
			)

			workerResult = {
				callId,
				result: transactionData,
			}

			break
		}
		case "calculateSummary": {
			const summary = calculateSummary(...(parameters as WorkerMethodParams<"calculateSummary">))

			workerResult = {
				callId,
				result: summary,
			}

			break
		}

		case "searchTransactions": {
			const searchResults = searchTransactions(
				...(parameters as WorkerMethodParams<"searchTransactions">)
			)
			workerResult = {
				callId,
				result: searchResults,
			}
			break
		}
		case "getFilteredTransactions": {
			const filteredTransactions = getFilteredTransactions(
				...(parameters as WorkerMethodParams<"getFilteredTransactions">)
			)

			workerResult = {
				callId,
				result: filteredTransactions,
			}
			break
		}
		default:
			workerResult = {
				callId,
				error: new Error(`Unknown method: ${method}`),
			}
			break
	}
	const elapsed = performance.now() - now
	self.postMessage({ ...workerResult, metadata: { elapsedTime: elapsed, method: method } })
}
