import React, { createContext, useContext, useState } from "react";

interface UserContextType {
  globalSettings: {
    theme: string;
    locale: string;
    currency: string;
    timezone: string;
    featureFlags: Record<string, boolean>;
    userRole: string;
    permissions: string[];
    lastActivity: Date;
  };
  notificationSettings: {
    email: boolean;
    push: boolean;
    sms: boolean;
    frequency: string;
    categories: string[];
  };
  updateGlobalSettings: (settings: any) => void;
  updateNotificationSettings: (settings: any) => void;
  trackActivity: (activity: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [globalSettings, setGlobalSettings] = useState({
    theme: "light",
    locale: "en-US",
    currency: "USD",
    timezone: "UTC",
    featureFlags: { newDashboard: true, advancedFilters: false },
    userRole: "user",
    permissions: ["read", "write"],
    lastActivity: new Date(),
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: false,
    sms: false,
    frequency: "daily",
    categories: ["transactions", "alerts"],
  });

  const updateGlobalSettings = (settings: any) => {
    setGlobalSettings((prev) => ({
      ...prev,
      ...settings,
      lastActivity: new Date(),
    }));
  };

  const updateNotificationSettings = (settings: any) => {
    setNotificationSettings((prev) => ({ ...prev, ...settings }));
  };

  const trackActivity = (activity: string) => {
    setGlobalSettings((prev) => ({
      ...prev,
      lastActivity: new Date(),
    }));
  };

  const value = {
    globalSettings,
    notificationSettings,
    updateGlobalSettings,
    updateNotificationSettings,
    trackActivity,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
