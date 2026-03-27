import type { ReactNode } from 'react';

type SectionProps = Readonly<{
  title: string;
  children: ReactNode;
  className?: string;
}>;

export function PageSection({ title, children, className }: SectionProps) {
  return (
    <section className={`space-y-2 ${className ?? ''}`.trim()}>
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

