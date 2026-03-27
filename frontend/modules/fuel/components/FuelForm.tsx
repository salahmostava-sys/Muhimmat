import { Plus } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';

type EmployeeOption = { id: string; name: string };

type FuelFormEntry = {
  employee_id: string;
  date: string;
  km_total: string;
  fuel_cost: string;
  notes: string;
};

export function FuelForm(props: Readonly<{
  riders: EmployeeOption[];
  entry: FuelFormEntry;
  defaultEntryDate: string;
  saving: boolean;
  onChange: (next: FuelFormEntry) => void;
  onSubmit: () => void;
}>) {
  const { riders, entry, defaultEntryDate, saving, onChange, onSubmit } = props;
  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div className="min-w-[160px] flex-1">
        <Label className="text-[10px] text-muted-foreground">مندوب</Label>
        <Select value={entry.employee_id} onValueChange={(value) => onChange({ ...entry, employee_id: value })}>
          <SelectTrigger className="h-9"><SelectValue placeholder="اختر المندوب" /></SelectTrigger>
          <SelectContent className="max-h-56">
            {riders.map((rider) => <SelectItem key={rider.id} value={rider.id}>{rider.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[10px] text-muted-foreground">تاريخ</Label>
        <Input type="date" className="h-9 w-[150px]" value={entry.date || defaultEntryDate} onChange={(event) => onChange({ ...entry, date: event.target.value })} />
      </div>
      <div>
        <Label className="text-[10px] text-muted-foreground">كم</Label>
        <Input type="number" className="h-9 w-24" value={entry.km_total} onChange={(event) => onChange({ ...entry, km_total: event.target.value })} placeholder="0" />
      </div>
      <div>
        <Label className="text-[10px] text-muted-foreground">بنزين (ر.س)</Label>
        <Input type="number" className="h-9 w-28" value={entry.fuel_cost} onChange={(event) => onChange({ ...entry, fuel_cost: event.target.value })} placeholder="0" />
      </div>
      <div className="min-w-[120px] flex-1">
        <Label className="text-[10px] text-muted-foreground">ملاحظات</Label>
        <Input className="h-9" value={entry.notes} onChange={(event) => onChange({ ...entry, notes: event.target.value })} placeholder="اختياري" />
      </div>
      <Button type="button" className="h-9 gap-1" onClick={onSubmit} disabled={saving}>
        <Plus size={14} /> {saving ? '...' : 'حفظ'}
      </Button>
    </div>
  );
}
