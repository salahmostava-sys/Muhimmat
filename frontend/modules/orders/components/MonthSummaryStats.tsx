import type React from 'react';
import { Loader2, Target, TrendingUp } from 'lucide-react';
import { Progress } from '@shared/components/ui/progress';
import { getAppColor, type AppColorData } from '@shared/hooks/useAppColors';
import type { App } from '@modules/orders/types';

type Props = Readonly<{
  loading: boolean;
  apps: App[];
  appColorsList: AppColorData[];
  employeesCount: number;
  grandTotal: number;
  targets: Record<string, string>;
  setTargets: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  appGrandTotal: (appId: string) => number;
  saveTarget: (appId: string, value: string) => void | Promise<void>;
  savingTarget: string | null;
  canEdit: boolean;
  isMonthLocked: boolean;
}>;

export function MonthSummaryStats(props: Props) {
  const {
    loading,
    apps,
    appColorsList,
    employeesCount,
    grandTotal,
    targets,
    setTargets,
    appGrandTotal,
    saveTarget,
    savingTarget,
    canEdit,
    isMonthLocked,
  } = props;

  if (loading || apps.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Target size={15} className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground">إجمالي المنصات والتارجت الشهري</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2">
        <div className="bg-card border border-primary/30 rounded-lg p-2.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-1">
            <TrendingUp size={12} className="text-primary" />
            <span className="text-[11px] font-semibold text-primary">الإجمالي</span>
          </div>
          <p className="text-lg font-bold text-foreground leading-tight">{grandTotal.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{employeesCount} مندوب</p>
        </div>

        {apps.map((app) => {
          const c = getAppColor(appColorsList, app.name);
          const total = appGrandTotal(app.id);
          const targetVal = Number.parseInt(targets[app.id] || '0', 10) || 0;
          const pct = targetVal > 0 ? Math.min(Math.round((total / targetVal) * 100), 100) : 0;
          const overTarget = targetVal > 0 && total >= targetVal;
          const isSaving = savingTarget === app.id;

          return (
            <div
              key={app.id}
              className="bg-card border border-border/50 rounded-lg p-2.5 flex flex-col gap-1.5 hover:border-border transition-colors"
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ backgroundColor: c.bg, color: c.text }}
                >
                  {app.name}
                </span>
                {overTarget && (
                  <span className="text-[9px] bg-success/10 text-success px-1 py-0.5 rounded-full font-semibold">
                    ✓
                  </span>
                )}
              </div>

              <div>
                <p className="text-base font-bold leading-tight" style={{ color: c.solid }}>
                  {total.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">طلب هذا الشهر</p>
              </div>

              <div className="flex items-center gap-1.5">
                <Target size={11} className="text-muted-foreground flex-shrink-0" />
                <input
                  type="number"
                  min={0}
                  placeholder="التارجت"
                  value={targets[app.id] ?? ''}
                  onChange={(e) => setTargets((prev) => ({ ...prev, [app.id]: e.target.value }))}
                  onBlur={(e) => void saveTarget(app.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void saveTarget(app.id, targets[app.id] || '0');
                  }}
                  disabled={!canEdit || isMonthLocked}
                  className="w-full h-6 text-[11px] rounded border border-border bg-muted/30 px-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-center"
                />
                {isSaving && <Loader2 size={10} className="animate-spin text-muted-foreground flex-shrink-0" />}
              </div>

              {targetVal > 0 && (
                <div className="space-y-1">
                  <Progress value={pct} className="h-1.5" />
                  <p className="text-[10px] font-semibold" style={{ color: overTarget ? 'hsl(var(--success))' : c.solid }}>
                    {pct}% من {targetVal.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
