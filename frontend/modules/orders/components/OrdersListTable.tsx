import type { Dispatch, SetStateAction } from 'react';
import { Button } from '@shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { OrdersMonthPagedRow } from '@shared/hooks/useOrdersPaged';
import { ORDERS_SKELETON_CELL_KEYS, ORDERS_SKELETON_ROW_KEYS } from '@modules/orders/utils/skeletonKeys';
import { toCityArabic } from '@modules/orders/utils/cityLabel';

type Props = Readonly<{
  isLoading: boolean;
  hasData: boolean;
  rows: OrdersMonthPagedRow[];
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  pageSize: number;
  setPageSize: Dispatch<SetStateAction<number>>;
  total: number;
  totalPages: number;
}>;

export function OrdersListTable(props: Props) {
  const { isLoading, hasData, rows, page, setPage, pageSize, setPageSize, total, totalPages } = props;

  return (
    <div className="bg-card rounded-2xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap">
                التاريخ
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap">
                المندوب
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap">
                الفرع
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap">
                المنصة
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground whitespace-nowrap">
                الطلبات
              </th>
            </tr>
          </thead>
          <tbody>
            {(isLoading || !hasData) && (
              <>
                {ORDERS_SKELETON_ROW_KEYS.map((rowKey) => (
                  <tr key={rowKey} className="border-b border-border/30">
                    {ORDERS_SKELETON_CELL_KEYS.map((cellKey) => (
                      <td key={`${rowKey}-${cellKey}`} className="px-3 py-3">
                        <div className="h-4 w-full bg-muted/40 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}

            {!isLoading &&
              rows.map((r) => (
                <tr
                  key={`${r.employee_id}-${r.app_id}-${r.date}`}
                  className="border-b border-border/30 hover:bg-muted/20"
                >
                  <td className="px-3 py-2 whitespace-nowrap">{r.date}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-medium">{r.employees?.name ?? '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{toCityArabic(r.employees?.city, '—')}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.apps?.name ?? '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.orders_count}</td>
                </tr>
              ))}

            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  لا توجد بيانات لهذا الشهر
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-3 border-t border-border/30 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">حجم الصفحة</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[25, 50, 100, 200].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">
          صفحة {page} / {totalPages} — الإجمالي {total}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8" disabled={page <= 1} onClick={() => setPage(1)}>
            الأولى
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronRight size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={page >= totalPages}
            onClick={() => setPage(totalPages)}
          >
            الأخيرة
          </Button>
        </div>
      </div>
    </div>
  );
}
