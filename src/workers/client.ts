import {
	CallInfo,
	WorkerCall,
	WorkerMethodParams,
	WorkerMethodReturn,
	WorkerMethods,
	WorkerResult,
} from "./types"

let worker: Worker | null = null

import workerUrl from "./web-worker?worker&url"

const callInfoMap = new Map<string, CallInfo>()

export async function call<Method extends WorkerMethods>(
	method: Method,
	parameters: WorkerMethodParams<Method>
): Promise<WorkerMethodReturn<Method>> {
	if (!worker) {
		throw new Error("Worker is not initialized. Call startWorker() first.")
	}

	const callId = crypto.randomUUID()

	const workerCall: WorkerCall<WorkerMethodParams<Method>> = {
		callId,
		method,
		parameters,
	}

	return new Promise((resolve, reject) => {
		worker!.postMessage(workerCall)
		callInfoMap.set(callId, {
			onSuccess: (result) => {
				callInfoMap.delete(callId)
				resolve(result as WorkerMethodReturn<Method>)
			},
			onError: (error) => {
				callInfoMap.delete(callId)
				reject(error)
			},
		})
	})
}

function setupWorkerListener() {
	if (!worker) {
		throw new Error("Worker is not initialized. Call startWorker() first.")
	}

	worker.addEventListener("message", (event: MessageEvent<WorkerResult>) => {
		const { callId, result, error } = event.data

		const callInfo = callInfoMap.get(callId)

		if (!callInfo) {
			return
		}

		if (error) {
			callInfo.onError(error)
		} else {
			callInfo.onSuccess(result)
		}
	})
}

export function startWorker() {
	worker = new Worker(new URL(workerUrl, import.meta.url), { type: "module" })
	setupWorkerListener()
}

export function endWorker() {
	if (worker) {
		worker.terminate()
		worker = null

		for (const [_, callInfo] of callInfoMap.entries()) {
			callInfo.onError(new Error("Worker terminated"))
		}
	}
}
