import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { OrdersMonthNavigator } from '@shared/components/orders/OrdersMonthNavigator';
import { useOrdersListTab } from '@modules/orders/hooks/useOrdersListTab';
import { monthLabel, shiftMonth } from '@modules/orders/utils/dateMonth';
import { OrdersListFilters } from '@modules/orders/components/OrdersListFilters';
import { OrdersListTable } from '@modules/orders/components/OrdersListTable';

export const OrdersListTab = React.memo(() => {
  const L = useOrdersListTab();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <OrdersMonthNavigator
          label={monthLabel(L.year, L.month)}
          onPrev={() => {
            const n = shiftMonth(L.year, L.month, -1);
            L.setYear(n.y);
            L.setMonth(n.m);
          }}
          onNext={() => {
            const n = shiftMonth(L.year, L.month, 1);
            L.setYear(n.y);
            L.setMonth(n.m);
          }}
        />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 h-9 text-xs px-2">
                <FolderOpen size={13} /> ملفات
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => void L.handleExportMonth()}>📊 تصدير Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <OrdersListFilters
        filters={L.filters}
        onChange={L.setFilters}
        driverOptions={(L.baseData?.employees ?? []).map((e) => ({ id: e.id, name: e.name }))}
        platformOptions={(L.baseData?.apps ?? []).map((a) => ({ id: a.id, name: a.name }))}
      />

      <OrdersListTable
        isLoading={L.paged.isLoading}
        hasData={!!L.paged.data}
        rows={L.rows}
        page={L.page}
        setPage={L.setPage}
        pageSize={L.pageSize}
        setPageSize={L.setPageSize}
        total={L.total}
        totalPages={L.totalPages}
      />
    </div>
  );
});

OrdersListTab.displayName = 'OrdersListTab';
