import React, { createContext, useContext } from 'react';

const AppInfoContext = createContext();

export const useAppInfo = () => {
  const context = useContext(AppInfoContext);
  if (!context) {
    throw new Error('useAppInfo must be used within an AppInfoProvider');
  }
  return context;
};

export const AppInfoProvider = ({ children }) => {
  // App information
  const appInfo = {
    version: '2.1.0',
    companyName: 'نظام إدارة جداول الكلية',
    buildTime: new Date().toISOString(), // Current time as build time
    appName: 'College Schedule System',
    developer: 'Team Alpha',
    description: 'نظام متطور وآمن لإدارة الجداول الأكاديمية'
  };

  return (
    <AppInfoContext.Provider value={appInfo}>
      {children}
    </AppInfoContext.Provider>
  );
};
