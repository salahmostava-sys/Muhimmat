import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

/** Tables backing Dashboard KPIs + analytics (invalidate on change; read-heavy). */
export const REALTIME_TABLES_DASHBOARD = [
  'employees',
  'attendance',
  'daily_orders',
  'audit_log',
  'vehicles',
  'alerts',
  'apps',
  'app_targets',
] as const;

export const REALTIME_TABLES_ALERTS_PAGE = ['employees', 'vehicles', 'platform_accounts', 'alerts'] as const;

export const REALTIME_TABLES_ALERTS_WIDGET = ['employees', 'vehicles'] as const;

/** Subscribe to postgres_changes on the given tables; cleanup on unmount. */
export function useRealtimePostgresChanges(
  channelName: string,
  tables: readonly string[],
  onEvent: () => void,
  options?: { invalidateQueryKeys?: QueryKey[] }
): void {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel(channelName);
    const handler = () => {
      onEventRef.current();
      const keys = options?.invalidateQueryKeys ?? [];
      keys.forEach((queryKey) => {
        void queryClient.invalidateQueries({ queryKey });
      });
    };
    tables.forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, handler);
    });
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, tables, options?.invalidateQueryKeys, queryClient]);
}
