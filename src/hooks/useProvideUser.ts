import { useState } from "react"
import { UserPreference } from "../types/user"

export function useProvideUser() {
	const [globalSettings, setGlobalSettings] = useState({
		theme: "light",
		locale: "en-US",
		currency: "USD",
		timezone: "UTC",
		featureFlags: { newDashboard: true, advancedFilters: false },
		userRole: "user",
		permissions: ["read", "write"],
		lastActivity: new Date(),
	})

	const [notificationSettings, setNotificationSettings] = useState({
		email: true,
		push: false,
		sms: false,
		frequency: "daily",
		categories: ["transactions", "alerts"],
	})

	const [userPreferences, setUserPreferences] = useState<UserPreference>({
		itemsPerPage: 50,
		sortOrder: "desc",
		enableNotifications: true,
		autoRefresh: true,
		showAdvancedFilters: false,
		compactView: false,
		timestamps: { created: Date.now(), updated: Date.now() },
	})

	const updateUserPreferences = (preferences: Partial<Omit<UserPreference, "timestamps">> = {}) => {
		setUserPreferences((prev) => ({
			...prev,
			...preferences,
			timestamps: { ...prev.timestamps, updated: Date.now() },
		}))
	}

	const updateGlobalSettings = (settings: any) => {
		setGlobalSettings((prev) => ({
			...prev,
			...settings,
			lastActivity: new Date(),
		}))
	}

	const updateNotificationSettings = (settings: any) => {
		setNotificationSettings((prev) => ({ ...prev, ...settings }))
	}

	const trackActivity = (_activity: string) => {
		setGlobalSettings((prev) => ({
			...prev,
			lastActivity: new Date(),
		}))
	}

	return {
		globalSettings,
		notificationSettings,
		updateGlobalSettings,
		updateNotificationSettings,
		trackActivity,
		updateUserPreferences,
		userPreferences,
	}
}
