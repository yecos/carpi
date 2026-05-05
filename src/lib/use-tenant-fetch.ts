'use client';

import { useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';

/**
 * Hook that provides tenant-aware API fetch utility.
 * Automatically appends archiiTenantId as a query parameter when available.
 */
export function useTenantFetch() {
  const { currentTenantId } = useAuth();

  const tenantFetch = useCallback(
    (url: string, options?: RequestInit) => {
      const separator = url.includes('?') ? '&' : '?';
      const tenantParam = currentTenantId
        ? `${separator}archiiTenantId=${encodeURIComponent(currentTenantId)}`
        : '';
      return fetch(`${url}${tenantParam}`, options);
    },
    [currentTenantId]
  );

  const getTenantId = useCallback(() => currentTenantId, [currentTenantId]);

  return { tenantFetch, getTenantId, currentTenantId };
}
