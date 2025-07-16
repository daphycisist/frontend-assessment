import { call } from "../workers/client"
import { WorkerMethodParams } from "../workers/types"

async function generateRiskAssessment(...args: WorkerMethodParams<"generateRiskAssessment">) {
	return call("generateRiskAssessment", args)
}

async function getAdvancedAnalytics(...args: WorkerMethodParams<"getAdvancedAnalytics">) {
	return call("getAdvancedAnalytics", args)
}

async function generateTransactionData(...args: WorkerMethodParams<"generateTransactionData">) {
	return call("generateTransactionData", args)
}

async function calculateSummary(...args: WorkerMethodParams<"calculateSummary">) {
	return call("calculateSummary", args)
}

async function searchTransactions(...args: WorkerMethodParams<"searchTransactions">) {
	return call("searchTransactions", args)
}

async function getFilteredTransactions(...args: WorkerMethodParams<"getFilteredTransactions">) {
	return call("getFilteredTransactions", args)
}

export function useWorker() {
	return {
		generateRiskAssessment,
		getAdvancedAnalytics,
		generateTransactionData,
		calculateSummary,
		searchTransactions,
		getFilteredTransactions,
	}
}
