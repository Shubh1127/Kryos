import { useState, useEffect } from 'react';
import { apiService, DashboardStats } from '@/lib/api';

interface DashboardData {
  stats: {
    totalUsers: number;
    totalApiKeys: number;
    totalEntries: number;
    totalFiles: number;
  };
  loading: boolean;
  error: string | null;
}

export function useDashboardData(): DashboardData {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalApiKeys: 0,
    totalEntries: 0,
    totalFiles: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard stats from the analytics endpoint
        const dashboardStats = await apiService.getDashboardStats();
        
        setStats({
          totalUsers: dashboardStats.totalUsers,
          totalApiKeys: dashboardStats.totalApiKeys,
          totalEntries: dashboardStats.totalEntries,
          totalFiles: dashboardStats.totalFiles,
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
        
        // Fallback to individual API calls if dashboard endpoint fails
        try {
          const [users, apiKeys, entries, files] = await Promise.all([
            apiService.getUsers(1, 1),
            apiService.getApiKeys(),
            apiService.getDataEntries(1, 1),
            apiService.getFiles(1, 1),
          ]);

          setStats({
            totalUsers: users.pagination?.total || 0,
            totalApiKeys: Array.isArray(apiKeys.data) ? apiKeys.data.length : 0,
            totalEntries: entries.pagination?.total || 0,
            totalFiles: files.pagination?.total || 0,
          });
        } catch (fallbackErr) {
          console.error('Fallback data fetch also failed:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return { stats, loading, error };
}
