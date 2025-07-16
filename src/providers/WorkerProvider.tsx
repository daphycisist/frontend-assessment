import { startWorker } from "../workers/client"

interface WorkerProviderProps {
	children?: React.ReactNode
}

startWorker()

export const WorkerProvider: React.FC<WorkerProviderProps> = ({ children }) => {
	// useLayoutEffect(() => {
	// 	startWorker()

	// 	return () => {
	// 		endWorker()
	// 	}
	// }, [])

	return <>{children}</>
}
