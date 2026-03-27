import type React from 'react';

export function FuelMonthlyTable(props: Readonly<{ tableRef: React.RefObject<HTMLTableElement | null>; bodyRows: React.ReactNode }>) {
  const { tableRef, bodyRows } = props;
  return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table ref={tableRef} className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground">المندوب</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">أيام مسجّلة</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">الكيلومترات</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">تكلفة البنزين</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">تكلفة/كم</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">الدباب 🏍️</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">عدد الطلبات 📦</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">بنزين/طلب</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">إجراءات</th>
            </tr>
          </thead>
          <tbody>{bodyRows}</tbody>
        </table>
      </div>
    </div>
  );
}
