import { Dashboard } from "./components/Dashboard"
import "./App.css"
import { WorkerProvider } from "./providers/WorkerProvider"
import { UserProvider } from "./providers/UserProvider"

function App() {
	return (
		<WorkerProvider>
			<UserProvider>
				<div className="App">
					<Dashboard />
				</div>
			</UserProvider>
		</WorkerProvider>
	)
}

export default App
