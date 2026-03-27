# Critical Routes Map

> هدف الملف: إعطاء صورة سريعة للمسارات التي تؤثر على التشغيل اليومي وتحتاج انتباهاً أعلى أثناء الصيانة والمراجعة.

## 1) `/` — Dashboard

- **Purpose:** نظرة تشغيلية سريعة (حضور/طلبات/مؤشرات).
- **Page:** `frontend/modules/pages/Dashboard.tsx`
- **Primary services:** `frontend/services/dashboardService.ts`
- **Guard / permission:** المسار داخل `ProtectedRoute`؛ لا `PageGuard` خاص.
- **Common issues:**
  - بطء أول تحميل بسبب تعدد الاستعلامات المتوازية.
  - اختلاف الأرقام غالباً من نافذة التاريخ أو الفلاتر.

## 2) `/employees` — Employees

- **Purpose:** إدارة بيانات الموظفين (تشغيلية + تعاقدية).
- **Page:** `frontend/modules/employees/EmployeesPage.tsx`
- **Primary services:** `frontend/services/employeeService.ts`, `frontend/services/driverService.ts`
- **Guard / permission:** `PageGuard pageKey="employees"`
- **Common issues:**
  - أخطاء حفظ بسبب قيود/تنسيق حقول الهوية أو التكرار.
  - نتائج بحث غير متوقعة عند عدم مزامنة الفلاتر مع query key.

## 3) `/attendance` — Attendance

- **Purpose:** حضور يومي/شهري وربطه بالمنصات.
- **Page:** `frontend/modules/pages/Attendance.tsx`
- **Primary services:** `frontend/services/attendanceService.ts`
- **Guard / permission:** `PageGuard pageKey="attendance"`
- **Common issues:**
  - فروقات في الإجماليات عند اختلاف المنطقة الزمنية أو تاريخ الإغلاق.
  - أخطاء تحديث جماعي عند تعارض نفس السجل من أكثر من مستخدم.

## 4) `/orders` — Orders

- **Purpose:** إدارة ومتابعة الطلبات اليومية.
- **Page:** `frontend/modules/orders/OrdersPage.tsx`
- **Primary services:** `frontend/services/orderService.ts`
- **Guard / permission:** `PageGuard pageKey="orders"`
- **Common issues:**
  - التباس بين بيانات اليوم الحالي والأرشيف (فلتر التاريخ).
  - مشاكل صلاحية على بعض العمليات (401/403) بسبب Role أو RLS.

## 5) `/salaries` — Salaries

- **Purpose:** احتساب/مراجعة الرواتب الشهرية.
- **Page:** `frontend/modules/salaries/SalariesPage.tsx`
- **Primary services:** `frontend/services/salaryService.ts`, `frontend/services/payrollService.ts`
- **Guard / permission:** `PageGuard pageKey="salaries"`
- **Common issues:**
  - اختلاف أرقام بسبب ترتيب تطبيق الخصومات/الحوافز.
  - بيانات stale بعد mutation إذا لم يتم `invalidateQueries` للمفاتيح الصحيحة.

---

## Quick review checklist for critical routes

- التغيير في الطبقة الصحيحة: صفحة -> hook -> service.
- مفاتيح React Query ثابتة ومعبرة، و`enabled` لا يعمل قبل توفر المعرفات.
- الأخطاء في service لا تُبتلع، والواجهة تعرض رسالة مفهومة.
- أي تغيير يؤثر سلوكياً يُذكر في `CHANGELOG.md` تحت `[Unreleased]`.
