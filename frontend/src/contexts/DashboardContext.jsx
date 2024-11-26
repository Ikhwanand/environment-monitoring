import React, { createContext, useContext, useState, useCallback } from 'react';
import { reports } from '../utils/api';

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const [dashboardData, setDashboardData] = useState({
    totalReports: 0,
    resolvedReports: 0,
    pendingReports: 0,
    recentReports: [],
  });

  const refreshDashboardData = useCallback(async () => {
    try {
      const response = await reports.getDashboardStats();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }, []);

  return (
    <DashboardContext.Provider value={{ dashboardData, refreshDashboardData }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
