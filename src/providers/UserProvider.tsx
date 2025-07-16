import { UserContext } from "../contexts/UserContext"
import { useProvideUser } from "../hooks/useProvideUser"

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const userProvider = useProvideUser()
	return <UserContext.Provider value={userProvider}>{children}</UserContext.Provider>
}
