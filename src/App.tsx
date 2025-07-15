import { UserProvider } from "./contexts/UserContext";
import "./App.css";
import { Dashboard } from "./components/SampleDashboard";

function App() {
  return (
    <UserProvider>
      <div className="App">
        <Dashboard />
      </div>
    </UserProvider>
  );
}

export default App;
