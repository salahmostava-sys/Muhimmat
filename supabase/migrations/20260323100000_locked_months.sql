-- Lock historical months to prevent further edits
CREATE TABLE IF NOT EXISTS public.locked_months (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month_year text NOT NULL UNIQUE,
  locked_at timestamp with time zone NOT NULL DEFAULT now(),
  locked_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.locked_months ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active users can view locked_months"
  ON public.locked_months FOR SELECT
  USING (is_active_user(auth.uid()));

CREATE POLICY "Admin/ops can manage locked_months"
  ON public.locked_months FOR ALL
  USING (
    is_active_user(auth.uid()) AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'operations'::app_role) OR
      has_role(auth.uid(), 'hr'::app_role) OR
      has_role(auth.uid(), 'finance'::app_role)
    )
  );
