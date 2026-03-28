import React from 'react';
import { Wrench } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { MaintenanceLogsTab } from '@modules/maintenance/components/MaintenanceLogsTab';
import { SparePartsTab } from '@modules/maintenance/components/SparePartsTab';

const MaintenancePage = () => {
  return (
    <div className="flex flex-col gap-3 w-full" dir="rtl">
      <div className="flex-shrink-0">
        <nav className="page-breadcrumb">
          <span>الرئيسية</span>
          <span className="page-breadcrumb-sep">/</span>
          <span>الصيانة والمخزون</span>
        </nav>
        <h1 className="page-title flex items-center gap-2">
          <Wrench size={18} /> الصيانة والمخزون
        </h1>
      </div>

      <Tabs defaultValue="logs" dir="rtl" className="w-full">
        <TabsList className="flex-shrink-0">
          <TabsTrigger value="logs">🔧 سجل الصيانة</TabsTrigger>
          <TabsTrigger value="inventory">📦 المخزون وقطع الغيار</TabsTrigger>
        </TabsList>
        <TabsContent value="logs" className="mt-4 outline-none">
          <MaintenanceLogsTab />
        </TabsContent>
        <TabsContent value="inventory" className="mt-4 outline-none">
          <SparePartsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaintenancePage;
