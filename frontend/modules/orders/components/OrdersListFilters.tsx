import {
  GlobalTableFilters,
  createDefaultGlobalFilters,
  type GlobalTableFilterState,
} from '@shared/components/table/GlobalTableFilters';

type Props = Readonly<{
  filters: GlobalTableFilterState;
  onChange: (v: GlobalTableFilterState) => void;
  driverOptions: { id: string; name: string }[];
  platformOptions: { id: string; name: string }[];
}>;

export function OrdersListFilters(props: Props) {
  const { filters, onChange, driverOptions, platformOptions } = props;

  return (
    <GlobalTableFilters
      value={filters}
      onChange={onChange}
      onReset={() => onChange(createDefaultGlobalFilters())}
      options={{
        enableDateRange: false,
        drivers: driverOptions,
        platforms: platformOptions,
      }}
    />
  );
}
