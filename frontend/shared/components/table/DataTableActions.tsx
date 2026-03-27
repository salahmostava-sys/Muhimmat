import { FileActionsMenu } from './FileActionsMenu';

/** 5MB import limit */
export const DATA_TABLE_IMPORT_MAX_BYTES = 5 * 1024 * 1024;

export type DataTableActionsProps = Readonly<{
  onExport: () => void | Promise<void>;
  onDownloadTemplate: () => void | Promise<void>;
  onPrint: () => void | Promise<void>;
  onImportFile: (file: File) => void | Promise<void>;
  /** Disables actions and shows spinner on primary/import affordance */
  loading?: boolean;
  disabled?: boolean;
  hideImport?: boolean;
  className?: string;
  /** Arabic labels (default) */
  labels?: Partial<{
    export: string;
    template: string;
    import: string;
    print: string;
  }>;
}>;

/** Unified compact actions menu for file operations. */
export function DataTableActions({
  onExport,
  onDownloadTemplate,
  onPrint,
  onImportFile,
  loading = false,
  disabled = false,
  hideImport = false,
  className,
  labels = {},
}: DataTableActionsProps) {
  const L = {
    export: labels.export ?? 'تصدير Excel',
    template: labels.template ?? 'تحميل قالب الاستيراد',
    import: labels.import ?? 'استيراد Excel',
    print: labels.print ?? 'طباعة الجدول',
  };

  return (
    <FileActionsMenu
      onExport={onExport}
      onDownloadTemplate={onDownloadTemplate}
      onPrint={onPrint}
      onImportFile={onImportFile}
      importMaxBytes={DATA_TABLE_IMPORT_MAX_BYTES}
      loading={loading}
      disabled={disabled}
      hideImport={hideImport}
      className={className}
      ariaLabel="إجراءات البيانات"
      labels={L}
      invalidSizeMessage="Error: file exceeds 5MB limit"
      invalidFormatMessage="Error: Invalid file format"
      logPrefix="[DataTableActions]"
    />
  );
}
