import { useState } from 'react';
import { employees, salarySchemes } from '@/data/mock';
import { Search, Plus, Filter, MoreVertical, ChevronDown, Eye, Edit, UserX, UserCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { differenceInDays, parseISO } from 'date-fns';
import EmployeeProfile from '@/components/employees/EmployeeProfile';
import AddEmployeeModal from '@/components/employees/AddEmployeeModal';

const statusLabels: Record<string, string> = {
  active: 'نشط',
  suspended: 'موقوف',
  terminated: 'منتهي',
  inactive: 'موقوف',
  ended: 'منتهي',
};

const statusStyles: Record<string, string> = {
  active: 'badge-success',
  suspended: 'badge-warning',
  terminated: 'badge-urgent',
  inactive: 'badge-warning',
  ended: 'badge-urgent',
};

const getResidencyBadge = (expiry: string) => {
  const days = differenceInDays(parseISO(expiry), new Date());
  if (days < 0) return { label: 'منتهية', cls: 'badge-urgent' };
  if (days < 30) return { label: `${days} يوم 🔴`, cls: 'badge-urgent' };
  if (days < 60) return { label: `${days} يوم 🟠`, cls: 'badge-warning' };
  return { label: `${days} يوم 🟢`, cls: 'badge-success' };
};

const appsList = ['هنقرستيشن', 'جاهز', 'كيتا', 'توبو', 'نينجا'];

const Employees = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [salaryTypeFilter, setSalaryTypeFilter] = useState<string>('all');
  const [residencyFilter, setResidencyFilter] = useState<string>('all');
  const [appFilter, setAppFilter] = useState<string>('all');
  const [schemeFilter, setSchemeFilter] = useState<string>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = employees.filter((e) => {
    const matchesSearch = e.name.includes(search) || e.phone.includes(search) || e.nationalId.includes(search);
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesSalaryType = salaryTypeFilter === 'all' || e.salaryType === salaryTypeFilter;
    const matchesApp = appFilter === 'all' || e.apps.includes(appFilter);
    const matchesScheme = schemeFilter === 'all' || e.schemeName === schemeFilter;
    const matchesVehicle = vehicleFilter === 'all' ||
      (vehicleFilter === 'with' && !!e.vehicleId) ||
      (vehicleFilter === 'without' && !e.vehicleId);

    let matchesResidency = true;
    if (residencyFilter !== 'all') {
      const days = differenceInDays(parseISO(e.residencyExpiry), new Date());
      if (residencyFilter === 'urgent') matchesResidency = days < 30;
      if (residencyFilter === 'warning') matchesResidency = days >= 30 && days < 60;
      if (residencyFilter === 'safe') matchesResidency = days >= 60;
    }

    return matchesSearch && matchesStatus && matchesSalaryType && matchesApp && matchesScheme && matchesVehicle && matchesResidency;
  }).sort((a, b) => {
    let valA: any = a.name;
    let valB: any = b.name;
    if (sortField === 'residency') {
      valA = differenceInDays(parseISO(a.residencyExpiry), new Date());
      valB = differenceInDays(parseISO(b.residencyExpiry), new Date());
    }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: string }) => (
    <span className="inline-block ml-1 text-muted-foreground">
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  if (selectedEmployee) {
    const emp = employees.find(e => e.id === selectedEmployee);
    if (emp) return <EmployeeProfile employee={emp} onBack={() => setSelectedEmployee(null)} />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الموظفون</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} من {employees.length} مندوب مسجل
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus size={16} />
            إضافة مندوب
          </Button>
          <Button variant="outline" className="gap-2">
            📥 استيراد Excel
          </Button>
          <Button variant="outline" className="gap-2">
            📋 تحميل قالب
          </Button>
          <Button variant="outline" className="gap-2">
            📤 تصدير Excel
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم، الهاتف أو رقم الهوية..."
              className="pr-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="suspended">موقوف</SelectItem>
              <SelectItem value="terminated">منتهي</SelectItem>
            </SelectContent>
          </Select>
          <Select value={salaryTypeFilter} onValueChange={setSalaryTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="نوع الراتب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="orders">طلبات</SelectItem>
              <SelectItem value="shift">دوام</SelectItem>
            </SelectContent>
          </Select>
          <Select value={residencyFilter} onValueChange={setResidencyFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="الإقامة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="urgent">🔴 عاجل &lt; 30 يوم</SelectItem>
              <SelectItem value="warning">🟠 تحذير &lt; 60 يوم</SelectItem>
              <SelectItem value="safe">🟢 آمن</SelectItem>
            </SelectContent>
          </Select>
          <Select value={appFilter} onValueChange={setAppFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="التطبيق" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              {appsList.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="المركبة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="with">معه مركبة</SelectItem>
              <SelectItem value="without">بدون مركبة</SelectItem>
            </SelectContent>
          </Select>
          {(statusFilter !== 'all' || salaryTypeFilter !== 'all' || residencyFilter !== 'all' || appFilter !== 'all' || vehicleFilter !== 'all') && (
            <Button variant="ghost" size="sm" onClick={() => {
              setStatusFilter('all'); setSalaryTypeFilter('all');
              setResidencyFilter('all'); setAppFilter('all'); setVehicleFilter('all');
            }} className="text-muted-foreground">
              مسح الكل
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          عرض {filtered.length} نتيجة من {employees.length}
        </p>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">لا يوجد موظفون مطابقون</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-right p-4 text-sm font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('name')}>
                    الاسم <SortIcon field="name" />
                  </th>
                  <th className="text-right p-4 text-sm font-semibold text-muted-foreground">الهاتف</th>
                  <th className="text-right p-4 text-sm font-semibold text-muted-foreground">رقم الهوية</th>
                  <th className="text-right p-4 text-sm font-semibold text-muted-foreground">نوع الراتب</th>
                  <th className="text-right p-4 text-sm font-semibold text-muted-foreground">التطبيقات</th>
                  <th className="text-right p-4 text-sm font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('residency')}>
                    الإقامة <SortIcon field="residency" />
                  </th>
                  <th className="text-right p-4 text-sm font-semibold text-muted-foreground">المركبة</th>
                  <th className="text-right p-4 text-sm font-semibold text-muted-foreground">الحالة</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => {
                  const residency = getResidencyBadge(emp.residencyExpiry);
                  return (
                    <tr key={emp.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedEmployee(emp.id)}
                          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                            {emp.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-foreground">{emp.name}</span>
                        </button>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground" dir="ltr">{emp.phone}</td>
                      <td className="p-4 text-sm text-muted-foreground font-mono" dir="ltr">{emp.nationalId}</td>
                      <td className="p-4">
                        <span className={`badge-${emp.salaryType === 'orders' ? 'info' : 'success'} text-xs`}>
                          {emp.salaryType === 'orders' ? `طلبات — ${emp.schemeName || 'بدون سكيمة'}` : `دوام — ${emp.monthlySalary?.toLocaleString()} ر.س`}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1 flex-wrap">
                          {emp.apps.map((app) => (
                            <span key={app} className="badge-info">{app}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={residency.cls}>{residency.label}</span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {emp.vehicleId ? <span className="badge-info">{emp.vehicleId}</span> : <span className="text-muted-foreground/50">—</span>}
                      </td>
                      <td className="p-4">
                        <span className={statusStyles[emp.status]}>{statusLabels[emp.status]}</span>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                              <MoreVertical size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => setSelectedEmployee(emp.id)}>
                              <Eye size={14} className="ml-2" /> عرض الملف
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit size={14} className="ml-2" /> تعديل
                            </DropdownMenuItem>
                            {emp.status === 'active' ? (
                              <DropdownMenuItem className="text-destructive">
                                <UserX size={14} className="ml-2" /> إيقاف
                              </DropdownMenuItem>
                            ) : emp.status === 'suspended' ? (
                              <DropdownMenuItem>
                                <UserCheck size={14} className="ml-2" /> إعادة تنشيط
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && <AddEmployeeModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
};

export default Employees;
