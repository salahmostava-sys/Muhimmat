import { useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNowStrict, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AlertTriangle, Bell, Bike, CheckCircle2, Package, TrendingDown, TrendingUp, UserRound, Trophy } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useAuth } from '@app/providers/AuthContext';
import { authQueryUserId, useAuthQueryGate } from '@shared/hooks/useAuthQueryGate';
import { usePermissions } from '@shared/hooks/usePermissions';
import { useEmployees } from '@shared/hooks/useEmployees';
import { useOrdersMonthPaged } from '@shared/hooks/useOrdersPaged';
import { useAlertsData } from '@shared/hooks/useAlertsData';
import { alertsService } from '@services/alertsService';
import { dashboardService } from '@services/dashboardService';
import type { Alert } from '@shared/lib/alertsBuilder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Button } from '@shared/components/ui/button';
import { useToast } from '@shared/hooks/use-toast';

type AppRole = 'admin' | 'hr' | 'finance' | 'operations' | 'viewer';
type Severity = Alert['severity'];

type OrderRow = {
  employee_id: string;
  app_id: string;
  date: string;
  orders_count: number;
  employees?: { id?: string; name?: string | null; city?: string | null } | null;
  apps?: { id?: string; name?: string | null } | null;
};

type LeaderboardRow = {
  employeeId: string;
  name: string;
  orders: number;
  km: number;
  bestApp: string;
  score: number;
};

const DAY_NAMES_AR = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'] as const;
const PLATFORM_COLOR_FALLBACK = ['#f97316', '#2563eb', '#10b981', '#a855f7', '#ec4899', '#14b8a6'] as const;
const SEVERITY_WEIGHT: Record<Severity, number> = { urgent: 0, warning: 1, info: 2 };

const sk = (key: string, className: string) => <div key={key} className={`animate-pulse rounded-xl bg-muted/40 ${className}`} />;

const toOrderRows = (rows: unknown[]): OrderRow[] => rows as OrderRow[];

const normalizeRole = (role: string | null): AppRole => {
  if (role === 'admin' || role === 'hr' || role === 'finance' || role === 'operations' || role === 'viewer') return role;
  return 'viewer';
};

const platformColor = (index: number) => PLATFORM_COLOR_FALLBACK[index % PLATFORM_COLOR_FALLBACK.length];

const percentDiff = (todayValue: number, yesterdayValue: number) => {
  if (yesterdayValue <= 0) return todayValue > 0 ? 100 : 0;
  return ((todayValue - yesterdayValue) / yesterdayValue) * 100;
};

const humanAlertAge = (iso: string) =>
  formatDistanceToNowStrict(new Date(iso), { addSuffix: true, locale: ar });

const estimatedKmFromOrders = (orders: number) => Math.round(orders * 5.5);

const severityLabel = (severity: Severity) => {
  if (severity === 'urgent') return 'CRITICAL';
  if (severity === 'warning') return 'WARNING';
  return 'INFO';
};

const severityClass = (severity: Severity) => {
  if (severity === 'urgent') return 'text-rose-600 bg-rose-50 border-rose-100';
  if (severity === 'warning') return 'text-amber-700 bg-amber-50 border-amber-100';
  return 'text-blue-700 bg-blue-50 border-blue-100';
};

const roleSections = (role: AppRole) => {
  const map: Record<AppRole, { kpi: boolean; platform: boolean; leaderboard: boolean; alerts: boolean; chart: boolean }> = {
    admin: { kpi: true, platform: true, leaderboard: true, alerts: true, chart: true },
    hr: { kpi: false, platform: false, leaderboard: true, alerts: true, chart: false },
    finance: { kpi: true, platform: false, leaderboard: false, alerts: false, chart: false },
    operations: { kpi: false, platform: true, leaderboard: true, alerts: false, chart: true },
    viewer: { kpi: false, platform: true, leaderboard: true, alerts: false, chart: true },
  };
  return map[role];
};

const buildLeaderboard = (rows: OrderRow[]): LeaderboardRow[] => {
  const byEmployee = new Map<string, { name: string; orders: number; byApp: Map<string, number> }>();
  for (const row of rows) {
    const id = row.employee_id;
    const name = row.employees?.name || '—';
    const app = row.apps?.name || 'غير محدد';
    const prev = byEmployee.get(id) ?? { name, orders: 0, byApp: new Map<string, number>() };
    prev.orders += row.orders_count || 0;
    prev.byApp.set(app, (prev.byApp.get(app) ?? 0) + (row.orders_count || 0));
    byEmployee.set(id, prev);
  }
  const maxOrders = Math.max(1, ...Array.from(byEmployee.values()).map(v => v.orders));
  return Array.from(byEmployee.entries())
    .map(([employeeId, v]) => {
      const bestAppEntry = Array.from(v.byApp.entries()).sort((a, b) => b[1] - a[1])[0];
      const score = Math.max(1, Math.min(5, Math.round((v.orders / maxOrders) * 5)));
      return {
        employeeId,
        name: v.name,
        orders: v.orders,
        km: estimatedKmFromOrders(v.orders),
        bestApp: bestAppEntry?.[0] ?? '—',
        score,
      };
    })
    .sort((a, b) => b.orders - a.orders);
};

const Dashboard = () => {
  const { role, user } = useAuth();
  const currentRole = normalizeRole(role);
  const { enabled, userId } = useAuthQueryGate();
  const uid = authQueryUserId(userId);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Explicit use of permission hook as requested.
  const { permissions: ordersPerm } = usePermissions('orders');
  const { permissions: employeesPerm } = usePermissions('employees');
  const { permissions: alertsPerm } = usePermissions('alerts');
  const { permissions: salariesPerm } = usePermissions('salaries');

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const currentMonth = format(new Date(), 'yyyy-MM');

  const [leaderboardTab, setLeaderboardTab] = useState<'month' | 'today'>('month');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const employeesQuery = useEmployees();
  const ordersQuery = useOrdersMonthPaged({
    monthYear: currentMonth,
    page: 1,
    pageSize: 5000,
    filters: {},
  });
  const alertsQuery = useAlertsData();

  const salaryInfoQuery = useQuery({
    queryKey: ['dashboard', uid, 'salary-month-total', currentMonth],
    enabled,
    queryFn: () => dashboardService.getMonthSalaryTotal(currentMonth),
    staleTime: 60_000,
  });

  const loading = employeesQuery.isLoading || ordersQuery.isLoading || alertsQuery.isLoading;

  const employees = useMemo(() => (employeesQuery.data || []) as Array<{ id: string; status?: string | null }>, [employeesQuery.data]);
  const orders = useMemo(() => toOrderRows(ordersQuery.data?.data || []), [ordersQuery.data]);
  const alerts = useMemo(() => alertsQuery.data || [], [alertsQuery.data]);

  const activeEmployeeIds = useMemo(() => new Set(employees.filter(e => e.status === 'active').map(e => e.id)), [employees]);
  const todayOrders = useMemo(() => orders.filter(r => r.date === today), [orders, today]);
  const yesterdayOrders = useMemo(() => orders.filter(r => r.date === yesterday), [orders, yesterday]);
  const monthOrders = orders;

  const totalOrdersToday = useMemo(() => todayOrders.reduce((s, r) => s + (r.orders_count || 0), 0), [todayOrders]);
  const activeRidersToday = useMemo(() => new Set(todayOrders.map(r => r.employee_id).filter(id => activeEmployeeIds.has(id))).size, [todayOrders, activeEmployeeIds]);
  const totalKmToday = useMemo(() => estimatedKmFromOrders(totalOrdersToday), [totalOrdersToday]);
  const activeAlerts = useMemo(() => alerts.filter(a => !a.resolved), [alerts]);

  const appsToday = useMemo(() => {
    const map = new Map<string, { name: string; today: number; yesterday: number }>();
    for (const row of todayOrders) {
      const appId = row.app_id;
      const appName = row.apps?.name || 'Other';
      const prev = map.get(appId) ?? { name: appName, today: 0, yesterday: 0 };
      prev.today += row.orders_count || 0;
      map.set(appId, prev);
    }
    for (const row of yesterdayOrders) {
      const appId = row.app_id;
      const appName = row.apps?.name || 'Other';
      const prev = map.get(appId) ?? { name: appName, today: 0, yesterday: 0 };
      prev.yesterday += row.orders_count || 0;
      map.set(appId, prev);
    }
    return Array.from(map.entries()).map(([id, v]) => ({
      appId: id,
      appName: v.name,
      today: v.today,
      yesterday: v.yesterday,
      diff: percentDiff(v.today, v.yesterday),
    })).sort((a, b) => b.today - a.today);
  }, [todayOrders, yesterdayOrders]);

  const leaderboardToday = useMemo(() => buildLeaderboard(todayOrders), [todayOrders]);
  const leaderboardMonth = useMemo(() => buildLeaderboard(monthOrders), [monthOrders]);
  const currentLeaderboard = leaderboardTab === 'today' ? leaderboardToday : leaderboardMonth;
  const top5Ids = useMemo(() => new Set(currentLeaderboard.slice(0, 5).map(r => r.employeeId)), [currentLeaderboard]);
  const bottom3Ids = useMemo(() => new Set(currentLeaderboard.slice(-3).map(r => r.employeeId)), [currentLeaderboard]);

  const topPerPlatform = useMemo(() => {
    const map = new Map<string, { rider: string; orders: number }>();
    const grouped = new Map<string, Map<string, { name: string; orders: number }>>();
    for (const row of monthOrders) {
      const app = row.apps?.name || 'Other';
      const perApp = grouped.get(app) ?? new Map<string, { name: string; orders: number }>();
      const current = perApp.get(row.employee_id) ?? { name: row.employees?.name || '—', orders: 0 };
      current.orders += row.orders_count || 0;
      perApp.set(row.employee_id, current);
      grouped.set(app, perApp);
    }
    for (const [app, riders] of grouped.entries()) {
      const best = Array.from(riders.values()).sort((a, b) => b.orders - a.orders)[0];
      if (best) map.set(app, { rider: best.name, orders: best.orders });
    }
    return Array.from(map.entries()).map(([app, best]) => ({ app, ...best })).sort((a, b) => b.orders - a.orders);
  }, [monthOrders]);

  const weekChartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
    const appNames = Array.from(new Set(monthOrders.map(r => r.apps?.name || 'Other')));
    return days.map((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const row: Record<string, string | number> = { day: DAY_NAMES_AR[day.getDay()], date: dateKey };
      for (const app of appNames) row[app] = 0;
      for (const order of monthOrders) {
        if (order.date !== dateKey) continue;
        const appName = order.apps?.name || 'Other';
        row[appName] = Number(row[appName] || 0) + (order.orders_count || 0);
      }
      return row;
    });
  }, [monthOrders]);

  const sections = roleSections(currentRole);

  const canViewOrdersByPerm = ordersPerm.can_view;
  const canViewEmployeesByPerm = employeesPerm.can_view;
  const canViewAlertsByPerm = alertsPerm.can_view;
  const canViewSalaryByPerm = salariesPerm.can_view;

  const showKpis = sections.kpi && canViewOrdersByPerm && canViewEmployeesByPerm;
  const showPlatforms = sections.platform && canViewOrdersByPerm;
  const showLeaderboard = sections.leaderboard && canViewOrdersByPerm;
  const showAlerts = sections.alerts && canViewAlertsByPerm;
  const showChart = sections.chart && canViewOrdersByPerm;

  const resolveAlert = async (alert: Alert) => {
    setResolvingId(alert.id);
    try {
      await alertsService.resolveAlert(alert.id, user?.id ?? null);
      await queryClient.invalidateQueries({ queryKey: ['alerts', uid, 'page-data'] });
      toast({ title: 'تم الحل', description: 'تم تحديث حالة التنبيه بنجاح' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'تعذر تحديث حالة التنبيه';
      toast({ title: 'خطأ', description: message, variant: 'destructive' });
    } finally {
      setResolvingId(null);
    }
  };

  let alertsPanelNode: ReactNode;
  if (loading) {
    alertsPanelNode = <div className="space-y-2">{['a1', 'a2', 'a3'].map(k => sk(k, 'h-14'))}</div>;
  } else if (activeAlerts.length === 0) {
    alertsPanelNode = (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 font-semibold">
        لا توجد تنبيهات نشطة ✅
      </div>
    );
  } else {
    alertsPanelNode = (
      <div className="space-y-2">
        {[...activeAlerts].sort((a, b) => SEVERITY_WEIGHT[a.severity] - SEVERITY_WEIGHT[b.severity]).map((alert) => (
          <div key={alert.id} className="rounded-xl border border-border/60 p-3 flex items-center gap-3">
            <div className={`rounded-lg border px-2 py-1 text-xs font-bold ${severityClass(alert.severity)}`}>
              <AlertTriangle size={12} className="inline me-1" />
              {severityLabel(alert.severity)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{alert.entityName}</p>
              <p className="text-xs text-muted-foreground">
                {alert.type} • منذ {humanAlertAge(alert.dueDate)}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={resolvingId === alert.id}
              onClick={() => void resolveAlert(alert)}
              className="gap-1"
            >
              <CheckCircle2 size={13} />
              تم الحل
            </Button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-5">
      <div className="page-header">
        <nav className="page-breadcrumb">
          <span>الرئيسية</span>
          <span className="page-breadcrumb-sep">/</span>
          <span>لوحة التحكم</span>
        </nav>
        <h1 className="page-title">لوحة التحكم الشاملة</h1>
      </div>

      {/* SECTION 1: KPI cards */}
      {showKpis && (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {loading ? (
            ['k1', 'k2', 'k3', 'k4'].map(key => sk(key, 'h-28'))
          ) : (
            <>
              <div className="rounded-2xl bg-card border border-border/60 p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">إجمالي الطلبات اليوم</span>
                  <Package size={16} className="text-primary" />
                </div>
                <p className="mt-3 text-3xl font-black">{totalOrdersToday.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl bg-card border border-border/60 p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">المناديب النشطين</span>
                  <UserRound size={16} className="text-emerald-600" />
                </div>
                <p className="mt-3 text-3xl font-black">{activeRidersToday.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl bg-card border border-border/60 p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">إجمالي الكيلومترات</span>
                  <Bike size={16} className="text-violet-600" />
                </div>
                <p className="mt-3 text-3xl font-black">{totalKmToday.toLocaleString()}</p>
              </div>
              <div className={`rounded-2xl border p-4 shadow-card ${activeAlerts.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-card border-border/60'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">التنبيهات النشطة</span>
                  <Bell size={16} className={activeAlerts.length > 0 ? 'text-rose-600' : 'text-muted-foreground'} />
                </div>
                <p className={`mt-3 text-3xl font-black ${activeAlerts.length > 0 ? 'text-rose-600' : ''}`}>{activeAlerts.length.toLocaleString()}</p>
              </div>
            </>
          )}
        </section>
      )}

      {currentRole === 'finance' && canViewSalaryByPerm && (
        <section className="rounded-2xl bg-card border border-border/60 p-4 shadow-card">
          <p className="text-xs text-muted-foreground">إجمالي الرواتب المعتمدة للشهر الحالي</p>
          <p className="text-2xl font-black mt-2">{(salaryInfoQuery.data || 0).toLocaleString()} ر.س</p>
        </section>
      )}

      {/* SECTION 2: platform orders */}
      {showPlatforms && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-muted-foreground">طلبات المنصات اليوم</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {loading
              ? ['p1', 'p2', 'p3', 'p4', 'p5'].map(key => sk(key, 'h-32'))
              : appsToday.map((app, idx) => {
                const isUp = app.diff >= 0;
                return (
                  <div key={app.appId} className="rounded-2xl bg-card border border-border/60 p-4 shadow-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: platformColor(idx) }} />
                        <span className="text-sm font-semibold">{app.appName}</span>
                      </div>
                      <span className={`text-xs font-bold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isUp ? <TrendingUp size={12} className="inline me-1" /> : <TrendingDown size={12} className="inline me-1" />}
                        {Math.abs(app.diff).toFixed(1)}%
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-black">{app.today.toLocaleString()}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">مقارنة بالأمس: {app.yesterday.toLocaleString()}</p>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* SECTION 3: leaderboard */}
      {showLeaderboard && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-muted-foreground">أفضل وأسوأ المناديب</h2>
          <div className="rounded-2xl bg-card border border-border/60 p-4 shadow-card">
            <Tabs value={leaderboardTab} onValueChange={(v) => setLeaderboardTab(v as 'month' | 'today')}>
              <TabsList className="mb-4">
                <TabsTrigger value="month">هذا الشهر</TabsTrigger>
                <TabsTrigger value="today">اليوم</TabsTrigger>
              </TabsList>
              <TabsContent value="month" />
              <TabsContent value="today" />
            </Tabs>

            {loading ? (
              <div className="space-y-2">
                {['l1', 'l2', 'l3', 'l4', 'l5'].map(k => sk(k, 'h-11'))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground">
                    <tr className="border-b border-border/70">
                      <th className="py-2 text-right">#</th>
                      <th className="py-2 text-right">الاسم</th>
                      <th className="py-2 text-right">الطلبات</th>
                      <th className="py-2 text-right">الكيلومترات</th>
                      <th className="py-2 text-right">المنصة الأفضل له</th>
                      <th className="py-2 text-right">التقييم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLeaderboard.map((row, idx) => (
                      <tr
                        key={row.employeeId}
                        className={`border-b border-border/40 ${top5Ids.has(row.employeeId) ? 'bg-emerald-50/60' : ''} ${bottom3Ids.has(row.employeeId) ? 'bg-rose-50/60' : ''}`}
                      >
                        <td className="py-2">{idx + 1}</td>
                        <td className="py-2 font-semibold">{row.name}</td>
                        <td className="py-2">{row.orders.toLocaleString()}</td>
                        <td className="py-2">{row.km.toLocaleString()}</td>
                        <td className="py-2">{row.bestApp}</td>
                        <td className="py-2">{'★'.repeat(row.score)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4">
              <p className="text-xs font-bold text-muted-foreground mb-2">أفضل منادب لكل منصة</p>
              <div className="flex flex-wrap gap-2">
                {topPerPlatform.map((item) => (
                  <span key={item.app} className="rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs">
                    {item.app}: {item.rider} — {item.orders} طلب
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 4: alerts panel */}
      {showAlerts && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-muted-foreground">التنبيهات النشطة</h2>
          <div className="rounded-2xl bg-card border border-border/60 p-4 shadow-card">
            {alertsPanelNode}
          </div>
        </section>
      )}

      {/* SECTION 5: week chart */}
      {showChart && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-muted-foreground">الطلبات خلال آخر 7 أيام</h2>
          <div className="rounded-2xl bg-card border border-border/60 p-4 shadow-card h-[320px]">
            {loading ? (
              sk('chart', 'h-full w-full')
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weekChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  {appsToday.map((app, idx) => (
                    <Line
                      key={app.appId}
                      type="monotone"
                      dataKey={app.appName}
                      stroke={platformColor(idx)}
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      )}

      {!showKpis && !showPlatforms && !showLeaderboard && !showAlerts && !showChart && (
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Trophy size={16} />
            لا توجد أقسام متاحة لهذا الدور.
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
