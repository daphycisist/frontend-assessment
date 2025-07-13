// import { Dashboard } from "./components/Dashboard";
import { UserProvider } from "./components/UserContext";
import "./App.css";
import { Dashboard } from "./components/Dashboard";

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
