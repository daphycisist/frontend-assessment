import { useLayoutEffect } from "react"
import { endWorker, startWorker } from "../workers/client"

interface WorkerProviderProps {
	children?: React.ReactNode
}

export const WorkerProvider: React.FC<WorkerProviderProps> = ({ children }) => {
	useLayoutEffect(() => {
		startWorker()

		return () => {
			endWorker()
		}
	}, [])

	return <>{children}</>
}
