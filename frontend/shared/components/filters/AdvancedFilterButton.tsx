import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';

export function AdvancedFilterButton(props: Readonly<{
  activeCount: number;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}>) {
  const { activeCount, onClick, disabled, className } = props;
  return (
    <Button type="button" variant="outline" onClick={onClick} disabled={disabled} className={className}>
      <SlidersHorizontal className="h-4 w-4" />
      فلتر متقدم
      {activeCount > 0 && (
        <Badge variant="default" className="min-w-[1.25rem] justify-center px-1.5 py-0 text-[11px]">
          {activeCount}
        </Badge>
      )}
    </Button>
  );
}
