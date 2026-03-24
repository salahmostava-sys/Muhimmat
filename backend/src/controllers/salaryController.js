const { supabaseAdmin } = require("../config/supabase");
const { asyncHandler } = require("../utils/asyncHandler");

const calcSalary = asyncHandler(async (req, res) => {
  const { employee, month } = req.query;
  if (!employee || !month) {
    return res.status(400).json({ message: "employee and month are required" });
  }

  const { data, error } = await supabaseAdmin.rpc("calculate_salary_for_employee_month", {
    p_employee_id: employee,
    p_month_year: month,
    p_payment_method: "cash",
    p_manual_deduction: 0,
    p_manual_deduction_note: null,
  });
  if (error) throw error;
  res.json(Array.isArray(data) ? data[0] || null : data);
});

module.exports = { calcSalary };
