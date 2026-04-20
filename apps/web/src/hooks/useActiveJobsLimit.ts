'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export interface ActiveJobsLimitInfo {
  current: number;
  limit: number | null;
  canCreate: boolean;
  plan: string | null;
  status: string;
}

export function useActiveJobsLimit() {
  const [data, setData] = useState<ActiveJobsLimitInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const info = await apiClient.getJobsLimits();
      setData(info);
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, refresh };
}
