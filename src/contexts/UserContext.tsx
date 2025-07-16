import { createContext } from "react"
import { UserPreference } from "../types/user"

interface UserContextType {
	globalSettings: {
		theme: string
		locale: string
		currency: string
		timezone: string
		featureFlags: Record<string, boolean>
		userRole: string
		permissions: string[]
		lastActivity: Date
	}
	notificationSettings: {
		email: boolean
		push: boolean
		sms: boolean
		frequency: string
		categories: string[]
	}
	userPreferences: UserPreference
	updateUserPreferences: (preferences?: Partial<Omit<UserPreference, "timestamps">>) => void
	updateGlobalSettings: (settings: any) => void
	updateNotificationSettings: (settings: any) => void
	trackActivity: (activity: string) => void
}

export const UserContext = createContext<UserContextType | undefined>(undefined)
