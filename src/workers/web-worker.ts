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

	switch (method) {
		case "generateRiskAssessment": {
			const methodResult = generateRiskAssessment(
				...(parameters as WorkerMethodParams<"generateRiskAssessment">)
			)

			workerResult = {
				callId,
				result: methodResult,
			}

			self.postMessage(workerResult)
			return
		}
		case "getAdvancedAnalytics": {
			const analyticsResult = getAdvancedAnalytics(
				...(parameters as WorkerMethodParams<"getAdvancedAnalytics">)
			)

			workerResult = {
				callId,
				result: analyticsResult,
			}

			self.postMessage(workerResult)
			return
		}
		case "generateTransactionData": {
			const transactionData = generateTransactionData(
				...(parameters as WorkerMethodParams<"generateTransactionData">)
			)

			workerResult = {
				callId,
				result: transactionData,
			}

			self.postMessage(workerResult)
			return
		}
		case "calculateSummary": {
			const summary = calculateSummary(...(parameters as WorkerMethodParams<"calculateSummary">))

			workerResult = {
				callId,
				result: summary,
			}

			self.postMessage(workerResult)
			return
		}

		case "searchTransactions": {
			const searchResults = searchTransactions(
				...(parameters as WorkerMethodParams<"searchTransactions">)
			)
			workerResult = {
				callId,
				result: searchResults,
			}
			self.postMessage(workerResult)
			return
		}
		case "getFilteredTransactions": {
			const filteredTransactions = getFilteredTransactions(
				...(parameters as WorkerMethodParams<"getFilteredTransactions">)
			)
			workerResult = {
				callId,
				result: filteredTransactions,
			}
			self.postMessage(workerResult)
			return
		}
		default:
			self.postMessage({ callId, error: new Error("Unknown method") })
	}
}
