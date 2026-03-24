const { supabaseAdmin } = require("../config/supabase");
const { asyncHandler } = require("../utils/asyncHandler");

const listOrders = asyncHandler(async (req, res) => {
  const { employee, month } = req.query;
  let query = supabaseAdmin.from("daily_orders").select("*").order("date", { ascending: false });

  if (employee) query = query.eq("employee_id", employee);
  if (month) {
    const from = `${month}-01`;
    const toDate = new Date(`${month}-01T00:00:00`);
    toDate.setMonth(toDate.getMonth() + 1);
    toDate.setDate(0);
    const to = `${month}-${String(toDate.getDate()).padStart(2, "0")}`;
    query = query.gte("date", from).lte("date", to);
  }

  const { data, error } = await query;
  if (error) throw error;
  res.json(data || []);
});

const createOrder = asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin.from("daily_orders").insert(req.body).select().single();
  if (error) throw error;
  res.status(201).json(data);
});

module.exports = { listOrders, createOrder };
