import React, { useMemo, useState } from 'react';
import { Plus, Search, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Label } from '@shared/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/components/ui/alert-dialog';
import { useToast } from '@shared/hooks/use-toast';
import { usePermissions } from '@shared/hooks/usePermissions';
import { useMaintenanceLogs, useSpareParts, useInvalidateMaintenanceQueries } from '@shared/hooks/useMaintenanceData';
import { vehicleService } from '@services/vehicleService';
import * as maintenanceService from '@services/maintenanceService';
import type { MaintenanceLogWithDetails } from '@services/maintenanceService';
import { AddMaintenanceModal } from '@modules/maintenance/components/AddMaintenanceModal';
import { useQuery } from '@tanstack/react-query';
import { useAuthQueryGate, authQueryUserId } from '@shared/hooks/useAuthQueryGate';

const MAINT_TYPES_ALL = [
  'غيار زيت',
  'صيانة دورية',
  'إطارات',
  'بطارية',
  'فرامل',
  'أعطال',
  'أخرى',
];

export function MaintenanceLogsTab() {
  const { permissions } = usePermissions('maintenance');
  const { toast } = useToast();
  const invalidate = useInvalidateMaintenanceQueries();
  const logsQ = useMaintenanceLogs();
  const partsQ = useSpareParts();
  const { enabled, userId } = useAuthQueryGate();
  const uid = authQueryUserId(userId);

  const vehiclesQ = useQuery({
    queryKey: ['vehicles', 'select', uid],
    queryFn: () => vehicleService.getForSelect(),
    enabled,
    staleTime: 60_000,
  });

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    MAINT_TYPES_ALL.forEach((t) => {
      m[t] = true;
    });
    return m;
  });
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceLogWithDetails | null>(null);
  const [deleting, setDeleting] = useState(false);

  const lowStockParts = useMemo(() => {
    const list = partsQ.data ?? [];
    return list.filter((p) => Number(p.stock_quantity) < Number(p.min_stock_alert ?? 0));
  }, [partsQ.data]);

  const filtered = useMemo(() => {
    const logs = logsQ.data ?? [];
    const q = search.trim().toLowerCase();
    return logs.filter((row) => {
      if (!typeFilter[row.type]) return false;
      if (!q) return true;
      const plate = row.vehicles?.plate_number?.toLowerCase() ?? '';
      const driver = row.employees?.name?.toLowerCase() ?? '';
      return plate.includes(q) || driver.includes(q);
    });
  }, [logsQ.data, search, typeFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await maintenanceService.deleteMaintenanceLog(deleteTarget.id);
      toast({ title: 'تم حذف السجل' });
      invalidate();
      setDeleteTarget(null);
    } catch (e) {
      toast({
        title: 'تعذر الحذف',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const loading = logsQ.isLoading || partsQ.isLoading;

  return (
    <div className="space-y-4" dir="rtl">
      {lowStockParts.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <strong>تنبيه مخزون:</strong> يوجد {lowStockParts.length} قطعة تحت الحد الأدنى. راجع تبويب المخزون.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            className="pr-9"
            placeholder="بحث بالوحة أو اسم السائق..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {permissions.can_edit && (
          <Button className="gap-1" onClick={() => setAddOpen(true)}>
            <Plus size={16} /> إضافة صيانة
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-4 items-center border rounded-lg p-3 bg-muted/20">
        <span className="text-xs font-medium text-muted-foreground">تصفية النوع:</span>
        {MAINT_TYPES_ALL.map((t) => (
          <div key={t} className="flex items-center gap-2">
            <Checkbox
              id={`mt-${t}`}
              checked={typeFilter[t]}
              onCheckedChange={(c) => setTypeFilter((prev) => ({ ...prev, [t]: c === true }))}
            />
            <Label htmlFor={`mt-${t}`} className="text-xs cursor-pointer">
              {t}
            </Label>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-right">التاريخ</th>
                <th className="px-3 py-2 text-right">المركبة</th>
                <th className="px-3 py-2 text-right">السائق</th>
                <th className="px-3 py-2 text-right">النوع</th>
                <th className="px-3 py-2 text-right">العداد</th>
                <th className="px-3 py-2 text-right">التكلفة</th>
                <th className="px-3 py-2 text-right">الحالة</th>
                <th className="px-3 py-2 text-right w-24">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="inline animate-spin mr-2" size={18} />
                    جاري التحميل...
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((row) => (
                  <tr key={row.id} className="border-b border-border/30 hover:bg-muted/20">
                    <td className="px-3 py-2 whitespace-nowrap">{row.maintenance_date}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-medium">
                      {row.vehicles?.plate_number ?? '—'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.employees?.name ?? '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.type}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {row.odometer_reading ?? '—'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {Number(row.total_cost ?? 0).toLocaleString('ar-SA')} ر.س
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.status}</td>
                    <td className="px-3 py-2">
                      {permissions.can_delete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleteTarget(row)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-muted-foreground">
                    لا توجد سجلات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddMaintenanceModal
        open={addOpen}
        onOpenChange={setAddOpen}
        vehicles={vehiclesQ.data ?? []}
        spareParts={partsQ.data ?? []}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف سجل الصيانة؟</AlertDialogTitle>
            <AlertDialogDescription>لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()} disabled={deleting}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
