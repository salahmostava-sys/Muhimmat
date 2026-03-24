const { supabaseAdmin } = require("../config/supabase");
const { asyncHandler } = require("../utils/asyncHandler");

const checkIn = asyncHandler(async (req, res) => {
  const { employee_id } = req.body;
  const now = new Date();
  const date = now.toISOString().slice(0, 10);

  const payload = {
    employee_id,
    date,
    check_in: now.toISOString(),
    status: "present",
  };

  const { data, error } = await supabaseAdmin
    .from("attendance")
    .upsert(payload, { onConflict: "employee_id,date" })
    .select()
    .single();
  if (error) throw error;
  res.status(201).json(data);
});

const checkOut = asyncHandler(async (req, res) => {
  const { employee_id } = req.body;
  const now = new Date();
  const date = now.toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin
    .from("attendance")
    .update({ check_out: now.toISOString() })
    .eq("employee_id", employee_id)
    .eq("date", date)
    .select()
    .single();
  if (error) throw error;
  res.json(data);
});

const getAttendanceByEmployee = asyncHandler(async (req, res) => {
  const { employee } = req.params;
  const { data, error } = await supabaseAdmin
    .from("attendance")
    .select("*")
    .eq("employee_id", employee)
    .order("date", { ascending: false });
  if (error) throw error;
  res.json(data || []);
});

module.exports = { checkIn, checkOut, getAttendanceByEmployee };
