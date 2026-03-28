import React, { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
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
import { useSpareParts, useInvalidateMaintenanceQueries } from '@shared/hooks/useMaintenanceData';
import * as maintenanceService from '@services/maintenanceService';
import type { SparePart } from '@services/maintenanceService';
import { cn } from '@shared/lib/utils';

const emptyForm: maintenanceService.CreateSparePartInput = {
  name_ar: '',
  part_number: '',
  stock_quantity: 0,
  min_stock_alert: 5,
  unit: 'قطعة',
  unit_cost: 0,
  supplier: '',
  notes: '',
};

export function SparePartsTab() {
  const { permissions } = usePermissions('maintenance');
  const { toast } = useToast();
  const invalidate = useInvalidateMaintenanceQueries();
  const q = useSpareParts();
  const rows = useMemo(() => q.data ?? [], [q.data]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SparePart | null>(null);
  const [form, setForm] = useState<maintenanceService.CreateSparePartInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SparePart | null>(null);

  const summary = useMemo(() => {
    let low = 0;
    let stockValue = 0;
    for (const p of rows) {
      if (Number(p.stock_quantity) < Number(p.min_stock_alert ?? 0)) low += 1;
      stockValue += Number(p.stock_quantity) * Number(p.unit_cost);
    }
    return { count: rows.length, low, stockValue };
  }, [rows]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: SparePart) => {
    setEditing(p);
    setForm({
      name_ar: p.name_ar,
      part_number: p.part_number ?? '',
      stock_quantity: p.stock_quantity,
      min_stock_alert: p.min_stock_alert,
      unit: p.unit,
      unit_cost: p.unit_cost,
      supplier: p.supplier ?? '',
      notes: p.notes ?? '',
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name_ar.trim()) {
      toast({ title: 'أدخل اسم القطعة', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await maintenanceService.updateSparePart(editing.id, {
          name_ar: form.name_ar,
          part_number: form.part_number || null,
          stock_quantity: Number(form.stock_quantity),
          min_stock_alert: Number(form.min_stock_alert),
          unit: form.unit ?? 'قطعة',
          unit_cost: Number(form.unit_cost),
          supplier: form.supplier || null,
          notes: form.notes || null,
        });
        toast({ title: 'تم التحديث' });
      } else {
        await maintenanceService.createSparePart({
          ...form,
          stock_quantity: Number(form.stock_quantity),
          min_stock_alert: Number(form.min_stock_alert),
          unit_cost: Number(form.unit_cost),
        });
        toast({ title: 'تمت الإضافة' });
      }
      invalidate();
      setDialogOpen(false);
    } catch (e) {
      toast({
        title: 'خطأ',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      await maintenanceService.deleteSparePart(deleteTarget.id);
      toast({ title: 'تم الحذف' });
      invalidate();
      setDeleteTarget(null);
    } catch (e) {
      toast({
        title: 'تعذر الحذف',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-xs text-muted-foreground">إجمالي القطع</div>
          <div className="text-2xl font-bold">{summary.count}</div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-xs text-muted-foreground">قطع تحت الحد</div>
          <div className="text-2xl font-bold text-destructive">{summary.low}</div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-xs text-muted-foreground">قيمة المخزون (تقديرية)</div>
          <div className="text-2xl font-bold">
            {summary.stockValue.toLocaleString('ar-SA', { maximumFractionDigits: 0 })} ر.س
          </div>
        </div>
      </div>

      {permissions.can_edit && (
        <div className="flex justify-end">
          <Button className="gap-1" onClick={openCreate}>
            <Plus size={16} /> إضافة قطعة
          </Button>
        </div>
      )}

      <div className="bg-card rounded-xl shadow-card overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-right">الاسم</th>
                <th className="px-3 py-2 text-right">رقم القطعة</th>
                <th className="px-3 py-2 text-right">المخزون</th>
                <th className="px-3 py-2 text-right">الحد الأدنى</th>
                <th className="px-3 py-2 text-right">الوحدة</th>
                <th className="px-3 py-2 text-right">سعر الوحدة</th>
                <th className="px-3 py-2 text-right">المورد</th>
                <th className="px-3 py-2 text-right w-28">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {q.isLoading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Loader2 className="inline animate-spin" />
                  </td>
                </tr>
              )}
              {!q.isLoading &&
                rows.map((p) => {
                  const low = Number(p.stock_quantity) < Number(p.min_stock_alert ?? 0);
                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        'border-b border-border/30',
                        low && 'bg-destructive/5 text-destructive'
                      )}
                    >
                      <td className="px-3 py-2 font-medium">{p.name_ar}</td>
                      <td className="px-3 py-2">{p.part_number ?? '—'}</td>
                      <td className="px-3 py-2">{p.stock_quantity}</td>
                      <td className="px-3 py-2">{p.min_stock_alert}</td>
                      <td className="px-3 py-2">{p.unit}</td>
                      <td className="px-3 py-2">{p.unit_cost}</td>
                      <td className="px-3 py-2">{p.supplier ?? '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          {permissions.can_edit && (
                            <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                              <Pencil size={16} />
                            </Button>
                          )}
                          {permissions.can_delete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => setDeleteTarget(p)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل قطعة' : 'إضافة قطعة'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1">
              <Label>الاسم</Label>
              <Input
                value={form.name_ar}
                onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>رقم القطعة</Label>
              <Input
                value={form.part_number ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, part_number: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>المخزون</Label>
                <Input
                  type="number"
                  value={form.stock_quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stock_quantity: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>الحد الأدنى</Label>
                <Input
                  type="number"
                  value={form.min_stock_alert}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, min_stock_alert: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>الوحدة</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>سعر الوحدة</Label>
                <Input
                  type="number"
                  value={form.unit_cost}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit_cost: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>المورد</Label>
              <Input
                value={form.supplier ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button disabled={saving} onClick={() => void save()}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف القطعة؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن الحذف إذا كانت مستخدمة في سجلات صيانة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => void doDelete()}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
