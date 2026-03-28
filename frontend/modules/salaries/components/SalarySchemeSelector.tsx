import { AlertTriangle, Settings2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';

/** شريط تنبيه عند غياب سكيمة أو قواعد تسعير لمنصات — مع رابط سريع للإعدادات */
export function SalarySchemeSelector(props: Readonly<{
  appsWithoutScheme: string[];
  appsWithoutPricingRulesDeduped: string[];
  onOpenSettings: () => void;
}>) {
  const { appsWithoutScheme, appsWithoutPricingRulesDeduped, onOpenSettings } = props;
  if (appsWithoutScheme.length === 0 && appsWithoutPricingRulesDeduped.length === 0) return null;
  return (
    <div className="flex items-center gap-3 bg-warning/10 border border-warning/30 rounded-xl px-4 py-3">
      <AlertTriangle size={18} className="text-warning flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">إعداد مطلوب للمنصات</p>
        {appsWithoutScheme.length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            بدون سكيمة رواتب:{' '}
            <span className="font-semibold text-warning mr-1">{appsWithoutScheme.join(' · ')}</span>
          </p>
        )}
        {appsWithoutPricingRulesDeduped.length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            بدون Pricing Rules:{' '}
            <span className="font-semibold text-warning mr-1">{appsWithoutPricingRulesDeduped.join(' · ')}</span>
          </p>
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 text-xs border-warning/40 text-warning hover:bg-warning/10 flex-shrink-0"
        onClick={onOpenSettings}
        type="button"
      >
        <Settings2 size={13} />
        <span>فتح الإعداد</span>
      </Button>
    </div>
  );
}
