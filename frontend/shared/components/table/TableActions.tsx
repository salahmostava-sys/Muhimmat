import { FileActionsMenu } from './FileActionsMenu';

export const TABLE_ACTIONS_IMPORT_MAX_BYTES = 5 * 1024 * 1024;

export type TableActionsProps = Readonly<{
  onDownloadTemplate: () => void | Promise<void>;
  onImportFile: (file: File) => void | Promise<void>;
  onExport: () => void | Promise<void>;
  onPrint: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  hideImport?: boolean;
  className?: string;
  labels?: Partial<{
    template: string;
    import: string;
    export: string;
    print: string;
  }>;
}>;

/** Salary/table compact file actions menu. */
export function TableActions({
  onDownloadTemplate,
  onImportFile,
  onExport,
  onPrint,
  loading = false,
  disabled = false,
  hideImport = false,
  className,
  labels = {},
}: TableActionsProps) {
  const L = {
    template: labels.template ?? 'تحميل قالب الاستيراد',
    import: labels.import ?? 'استيراد Excel',
    export: labels.export ?? 'تصدير Excel',
    print: labels.print ?? 'طباعة الجدول',
  };

  return (
    <FileActionsMenu
      onExport={onExport}
      onDownloadTemplate={onDownloadTemplate}
      onPrint={onPrint}
      onImportFile={onImportFile}
      importMaxBytes={TABLE_ACTIONS_IMPORT_MAX_BYTES}
      loading={loading}
      disabled={disabled}
      hideImport={hideImport}
      className={className}
      ariaLabel="إجراءات الجدول"
      labels={L}
      invalidSizeMessage="حجم الملف يتجاوز 5 ميجابايت"
      invalidFormatMessage="صيغة الملف غير مدعومة — استخدم xlsx أو xls"
      logPrefix="[TableActions]"
    />
  );
}
