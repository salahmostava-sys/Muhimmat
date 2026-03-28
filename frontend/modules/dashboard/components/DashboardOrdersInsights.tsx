import { useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Flame, UserCheck, type LucideIcon } from 'lucide-react';
import { supabase } from '@services/supabase/client';
import { useOrders } from '@shared/hooks/useOrders';
import { useAnalytics } from '@shared/hooks/useAnalytics';
import { predictOrders } from '@shared/lib/predictOrders';
import { useAppColors } from '@shared/hooks/useAppColors';
import { authQueryUserId, useAuthQueryGate } from '@shared/hooks/useAuthQueryGate';
import { useAuth } from '@app/providers/AuthContext';
import { Skeleton } from '@shared/components/ui/skeleton';
import { DailyOrdersTrendChart } from '@modules/dashboard/components/DailyOrdersTrendChart';

function InsightCard({
  title,
  icon: Icon,
  children,
}: Readonly<{
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}>) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-foreground">
        <Icon className="h-5 w-5 text-primary shrink-0" aria-hidden />
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      <div className="text-foreground">{children}</div>
    </div>
  );
}

export function DashboardOrdersInsights() {
  const { data: orderRows, isLoading } = useOrders();
  const analytics = useAnalytics(orderRows ?? []);
  const { apps, loading: appsLoading } = useAppColors();

  const dailySeries = useMemo(() => {
    if (!analytics?.daily) return [];
    return Object.keys(analytics.daily)
      .sort()
      .map((k) => analytics.daily[k] ?? 0);
  }, [analytics]);

  const prediction = useMemo(() => predictOrders(dailySeries), [dailySeries]);

  const topAppId = analytics?.topPlatform?.[0];
  const topAppOrders = analytics?.topPlatform?.[1];

  const appLabel = useMemo(() => {
    if (!topAppId) return '—';
    const name = apps.find((a) => a.id === topAppId)?.name;
    return name ?? topAppId;
  }, [apps, topAppId]);

  const { user } = useAuth();
  const { enabled, userId } = useAuthQueryGate();
  const uid = authQueryUserId(user?.id ?? userId);

  const topEmployeeId = analytics?.topEmployee?.[0];
  const topEmployeeOrders = analytics?.topEmployee?.[1];

  const empQ = useQuery({
    queryKey: ['dashboard-orders-insights-employee', uid, topEmployeeId],
    enabled: enabled && !!topEmployeeId,
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('name').eq('id', topEmployeeId!).maybeSingle();
      if (error) throw error;
      return data?.name ?? null;
    },
    staleTime: 60_000,
  });

  if (isLoading || appsLoading) {
    return (
      <div className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          {['i1', 'i2', 'i3'].map((k) => (
            <Skeleton key={k} className="h-28 rounded-2xl w-full" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl w-full" />
      </div>
    );
  }

  if (!orderRows?.length || !analytics) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground" dir="rtl">
        لا توجد بيانات طلبات كافية لعرض الرؤى والتوقعات بعد.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <InsightCard title="توقع الطلبات (من السلسلة اليومية)" icon={Sparkles}>
          <p className="text-2xl font-black tabular-nums">{prediction.toLocaleString('ar-SA')}</p>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
            تقدير من متوسط آخر سبعة أيام مع نصف تغيّر آخر يومين (بعد ترتيب التواريخ).
          </p>
        </InsightCard>

        <InsightCard title="أكثر منصة نشاطًا" icon={Flame}>
          <p className="text-lg font-bold truncate" title={appLabel}>
            {appLabel}
          </p>
          {topAppOrders != null && (
            <p className="text-sm text-muted-foreground tabular-nums">
              {topAppOrders.toLocaleString('ar-SA')} طلبًا (في البيانات المحمّلة)
            </p>
          )}
        </InsightCard>

        <InsightCard title="أفضل مندوب" icon={UserCheck}>
          <p className="text-lg font-bold truncate">
            {empQ.isLoading ? '…' : empQ.data ?? topEmployeeId ?? '—'}
          </p>
          {topEmployeeOrders != null && (
            <p className="text-sm text-muted-foreground tabular-nums">
              {topEmployeeOrders.toLocaleString('ar-SA')} طلبًا
            </p>
          )}
        </InsightCard>
      </div>

      <div className="bg-card rounded-2xl border border-border/60 shadow-card p-5">
        <h3 className="text-sm font-bold text-foreground mb-1">الطلبات اليومية (مجمّعة)</h3>
        <p className="text-xs text-muted-foreground mb-4">من سجلات الطلبات اليومية الحالية</p>
        <DailyOrdersTrendChart daily={analytics.daily} />
      </div>
    </div>
  );
}
