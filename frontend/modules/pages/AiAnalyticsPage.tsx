import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addMonths, format, parse, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Sparkles, TrendingUp } from 'lucide-react';
import { PageSection } from '@shared/components/layout/PageScaffold';
import { dashboardService } from '@services/dashboardService';
import { authQueryUserId, useAuthQueryGate } from '@shared/hooks/useAuthQueryGate';
import { useAuth } from '@app/providers/AuthContext';
import { defaultQueryRetry } from '@shared/lib/query';
import { QueryErrorRetry } from '@shared/components/QueryErrorRetry';
import { Skeleton } from '@shared/components/ui/skeleton';
import { predictOrders } from '@shared/lib/predictOrders';

const MONTHS_BACK = 8;

type ChartRow = {
  month: string;
  actual: number | null;
  forecast: number | null;
};

const AiAnalyticsPage = () => {
  const { user } = useAuth();
  const { enabled, userId } = useAuthQueryGate();
  const uid = authQueryUserId(user?.id ?? userId);

  const monthKeys = useMemo(() => {
    const keys: string[] = [];
    for (let i = MONTHS_BACK - 1; i >= 0; i--) {
      keys.push(format(subMonths(new Date(), i), 'yyyy-MM'));
    }
    return keys;
  }, []);

  const q = useQuery({
    queryKey: ['ai-analytics', 'orders-trend', uid, monthKeys],
    enabled,
    retry: defaultQueryRetry,
    queryFn: async () => {
      const totals: number[] = [];
      for (const my of monthKeys) {
        const c = await dashboardService.getMonthOrdersCount(my);
        totals.push(c);
      }
      return { totals, monthKeys };
    },
  });

  const { chartData, forecast } = useMemo(() => {
    if (!q.data?.totals.length) {
      return {
        chartData: [] as ChartRow[],
        forecast: null as { next: number; lastGrowth: number } | null,
      };
    }
    const { totals, monthKeys: keys } = q.data;
    const next = Math.max(0, predictOrders(totals));
    const lastGrowth =
      totals.length >= 2 ? totals[totals.length - 1] - totals[totals.length - 2] : 0;
    const fc = { next, lastGrowth };
    const rows: ChartRow[] = keys.map((k, i) => ({
      month: format(parse(`${k}-01`, 'yyyy-MM-dd', new Date()), 'MMM yyyy', { locale: ar }),
      actual: totals[i],
      forecast: null,
    }));
    const lastIdx = rows.length - 1;
    if (lastIdx >= 0) {
      rows[lastIdx] = {
        ...rows[lastIdx],
        forecast: totals[lastIdx],
      };
    }
    const lastKey = keys[keys.length - 1];
    const nextMonthDate = addMonths(parse(`${lastKey}-01`, 'yyyy-MM-dd', new Date()), 1);
    const nextLabel = format(nextMonthDate, 'MMM yyyy', { locale: ar });
    rows.push({
      month: `${nextLabel} (تنبؤ)`,
      actual: null,
      forecast: next,
    });
    return { chartData: rows, forecast: fc };
  }, [q.data]);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="page-header">
        <nav className="page-breadcrumb">
          <span>الرئيسية</span>
          <span className="page-breadcrumb-sep">/</span>
          <span>تحليلات ذكية</span>
        </nav>
        <h1 className="page-title flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" aria-hidden />
          تحليلات ذكية
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          عرض اتجاه الطلبات الشهرية مع تنبؤ تقديري (متوسط آخر سبعة أشهر + نصف تغيّر آخر شهرين) — للمساعدة في التخطيط وليس كضماناً تشغيلياً.
        </p>
      </div>

      <PageSection title="ملخص التنبؤ">
        {q.isLoading ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : q.isError ? (
          <QueryErrorRetry onRetry={() => void q.refetch()} />
        ) : (
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-semibold">تنبؤ الطلبات للشهر القادم:</span>
              <span className="text-2xl font-bold tabular-nums">
                {forecast != null ? forecast.next.toLocaleString('ar-SA') : '—'}
              </span>
            </div>
            {forecast != null && (
              <span className="text-xs text-muted-foreground">
                التغيّر بين آخر شهرين: {forecast.lastGrowth >= 0 ? '+' : ''}
                {Math.round(forecast.lastGrowth).toLocaleString('ar-SA')} طلب
              </span>
            )}
          </div>
        )}
      </PageSection>

      <PageSection title="الطلبات — فعلي مقابل تنبؤ">
        <div className="h-[380px] w-full min-h-[320px]">
          {q.isLoading ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : q.isError ? (
            <QueryErrorRetry onRetry={() => void q.refetch()} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} interval={0} angle={-22} textAnchor="end" height={72} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => Number(v).toLocaleString('ar-SA')} />
                <Tooltip
                  formatter={(value: number | undefined, name: string) => {
                    const label = name === 'actual' ? 'فعلي' : 'تنبؤ';
                    return [value != null ? value.toLocaleString('ar-SA') : '—', label];
                  }}
                  contentStyle={{ direction: 'rtl' }}
                />
                <Legend formatter={(value) => (value === 'actual' ? 'فعلي' : 'تنبؤ')} />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="actual"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="forecast"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </PageSection>
    </div>
  );
};

export default AiAnalyticsPage;
