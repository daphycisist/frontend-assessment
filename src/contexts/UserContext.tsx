/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useState } from "react";
import { UserContextType } from "../types/transaction";

const initSettings: UserContextType =  {
  globalSettings: {
    theme: "light",
    locale: "en-US",
    currency: "USD",
    timezone: "UTC",
    featureFlags: { newDashboard: true, advancedFilters: false },
    userRole: "user",
    permissions: ["read", "write"],
    lastActivity: new Date(),
  },
  notificationSettings: {
    email: true,
    push: false,
    sms: false,
    frequency: "daily",
    categories: ["transactions", "alerts"],
  },
  updateGlobalSettings: () => {},
  updateNotificationSettings: () => {},
  trackActivity: () => {}
};

export const UserContext = createContext<UserContextType>(initSettings);

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
    activity: '',
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
    setGlobalSettings((prev: any) => ({
      ...prev,
      ...settings,
      lastActivity: new Date(),
    }));
  };

  const updateNotificationSettings = (settings: any) => {
    setNotificationSettings((prev: any) => ({ ...prev, ...settings }));
  };

  const trackActivity = (activity: string) => {
    setGlobalSettings((prev: any) => ({
      ...prev,
      activity,
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

