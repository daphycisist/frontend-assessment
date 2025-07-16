import { FilterOptions, Transaction } from "../types/transaction"
import { UserPreference } from "../types/user"
import type { generateRiskAssessment } from "../utils/analyticsEngine"
import { generateTransactionData, calculateSummary } from "../utils/dataGenerator"
import type { getAdvancedAnalytics } from "../utils/transactionHelpers"

export type WorkerMethods =
	| "generateRiskAssessment"
	| "getAdvancedAnalytics"
	| "generateTransactionData"
	| "calculateSummary"
	| "searchTransactions"
	| "getFilteredTransactions"

export type WorkerMethodParams<Method extends WorkerMethods> =
	Method extends "generateRiskAssessment"
		? [Transaction[]]
		: Method extends "getAdvancedAnalytics"
		? [Transaction[]]
		: Method extends "generateTransactionData"
		? [number]
		: Method extends "calculateSummary"
		? [Transaction[]]
		: Method extends "searchTransactions"
		? [Transaction[], string]
		: Method extends "getFilteredTransactions"
		? [Transaction[], FilterOptions, UserPreference]
		: never

export type WorkerMethodReturn<Method extends WorkerMethods> =
	Method extends "generateRiskAssessment"
		? ReturnType<typeof generateRiskAssessment>
		: Method extends "getAdvancedAnalytics"
		? ReturnType<typeof getAdvancedAnalytics>
		: Method extends "generateTransactionData"
		? ReturnType<typeof generateTransactionData>
		: Method extends "calculateSummary"
		? ReturnType<typeof calculateSummary>
		: Method extends "searchTransactions"
		? Transaction[]
		: Method extends "getFilteredTransactions"
		? Transaction[]
		: never

export type WorkerCall<Parameters> = {
	callId: string
	method: WorkerMethods
	parameters: Parameters
}

export type WorkerResult = {
	callId: string
	result?: any
	error?: any
}

export type CallInfo = {
	onSuccess: (result: any) => void
	onError: (error: any) => void
}
