import React from 'react';
import { Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { SpreadsheetGridTab } from '@modules/orders/components/SpreadsheetGridTab';
import { MonthSummaryTab } from '@modules/orders/components/MonthSummaryTab';
import { OrdersListTab } from '@modules/orders/components/OrdersListTab';

const OrdersPage = () => {
  return (
    <div className="flex flex-col gap-3 w-full" dir="rtl">
      <div className="flex-shrink-0">
        <nav className="page-breadcrumb">
          <span>الرئيسية</span>
          <span className="page-breadcrumb-sep">/</span>
          <span>الطلبات اليومية</span>
        </nav>
        <h1 className="page-title flex items-center gap-2">
          <Package size={18} /> الطلبات اليومية
        </h1>
      </div>

      <Tabs defaultValue="grid" dir="rtl" className="w-full">
        <TabsList className="flex-shrink-0">
          <TabsTrigger value="grid">📊 Grid الشهري</TabsTrigger>
          <TabsTrigger value="summary">ملخص الشهر</TabsTrigger>
          <TabsTrigger value="list">قائمة (سريعة)</TabsTrigger>
        </TabsList>
        <TabsContent value="grid" className="mt-4 outline-none">
          <SpreadsheetGridTab />
        </TabsContent>
        <TabsContent value="summary" className="mt-4 overflow-x-auto outline-none">
          <MonthSummaryTab />
        </TabsContent>
        <TabsContent value="list" className="mt-4 outline-none">
          <OrdersListTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrdersPage;
