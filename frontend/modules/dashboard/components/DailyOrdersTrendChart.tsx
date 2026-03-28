import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Row = { label: string; orders: number };

export function DailyOrdersTrendChart(props: Readonly<{ daily: Record<string, number> }>) {
  const { daily } = props;

  const data = useMemo(() => {
    const keys = Object.keys(daily).sort();
    return keys.map((k): Row => {
      let label = k;
      try {
        const d = k.includes('T') ? parseISO(k.split('T')[0]) : parseISO(`${k}T12:00:00`);
        label = format(d, 'd MMM', { locale: ar });
      } catch {
        label = k;
      }
      return { label, orders: daily[k] ?? 0 };
    });
  }, [daily]);

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10" dir="rtl">
        لا توجد بيانات يومية لعرضها
      </p>
    );
  }

  return (
    <div dir="rtl" className="w-full min-h-[220px]">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => Number(v).toLocaleString('ar-SA')} />
          <Tooltip
            formatter={(v: number) => [v.toLocaleString('ar-SA'), 'طلبات']}
            contentStyle={{ direction: 'rtl' }}
          />
          <Bar dataKey="orders" name="الطلبات" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
