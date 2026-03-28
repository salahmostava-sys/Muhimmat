-- Replace legacy maintenance_logs with fleet maintenance + line-item parts.
-- Preserves old rows in maintenance_logs_legacy_pre_fleet.

BEGIN;

DROP POLICY IF EXISTS "Active users can view maintenance_logs" ON public.maintenance_logs;
DROP POLICY IF EXISTS "Operations/admin can manage maintenance_logs" ON public.maintenance_logs;
DROP POLICY IF EXISTS "Ops/admin can view maintenance_logs" ON public.maintenance_logs;
DROP POLICY IF EXISTS "Authenticated can view maintenance_logs" ON public.maintenance_logs;

ALTER TABLE IF EXISTS public.maintenance_logs RENAME TO maintenance_logs_legacy_pre_fleet;

CREATE TABLE public.maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL
    CHECK (type IN (
      'غيار زيت', 'صيانة دورية', 'إطارات', 'بطارية', 'فرامل', 'أعطال', 'أخرى'
    )),
  odometer_reading NUMERIC(10, 0),
  total_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'مكتملة'
    CHECK (status IN ('مكتملة', 'جارية', 'ملغاة')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.maintenance_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_log_id UUID NOT NULL REFERENCES public.maintenance_logs(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.spare_parts(id) ON DELETE RESTRICT,
  quantity_used NUMERIC(10, 2) NOT NULL,
  cost_at_time NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_maintenance_logs_vehicle_id ON public.maintenance_logs(vehicle_id);
CREATE INDEX idx_maintenance_logs_maintenance_date ON public.maintenance_logs(maintenance_date DESC);
CREATE INDEX idx_maintenance_parts_log_id ON public.maintenance_parts(maintenance_log_id);
CREATE INDEX idx_maintenance_parts_part_id ON public.maintenance_parts(part_id);

ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active users can view maintenance_logs"
  ON public.maintenance_logs FOR SELECT
  TO authenticated
  USING (is_active_user(auth.uid()));

CREATE POLICY "Operations/admin can manage maintenance_logs"
  ON public.maintenance_logs FOR ALL
  TO authenticated
  USING (
    is_active_user(auth.uid()) AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'operations'::app_role)
    )
  )
  WITH CHECK (
    is_active_user(auth.uid()) AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'operations'::app_role)
    )
  );

CREATE POLICY "Active users can view maintenance_parts"
  ON public.maintenance_parts FOR SELECT
  TO authenticated
  USING (is_active_user(auth.uid()));

CREATE POLICY "Operations/admin can manage maintenance_parts"
  ON public.maintenance_parts FOR ALL
  TO authenticated
  USING (
    is_active_user(auth.uid()) AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'operations'::app_role)
    )
  )
  WITH CHECK (
    is_active_user(auth.uid()) AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'operations'::app_role)
    )
  );

DROP TRIGGER IF EXISTS update_maintenance_logs_updated_at ON public.maintenance_logs;
CREATE TRIGGER update_maintenance_logs_updated_at
  BEFORE UPDATE ON public.maintenance_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
