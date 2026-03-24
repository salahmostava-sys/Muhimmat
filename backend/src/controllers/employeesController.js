const { supabaseAdmin } = require("../config/supabase");
const { asyncHandler } = require("../utils/asyncHandler");

const listEmployees = asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin.from("employees").select("*").order("name");
  if (error) throw error;
  res.json(data || []);
});

const createEmployee = asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin.from("employees").insert(req.body).select().single();
  if (error) throw error;
  res.status(201).json(data);
});

const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin
    .from("employees")
    .update(req.body)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  res.json(data);
});

const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin.from("employees").delete().eq("id", id);
  if (error) throw error;
  res.status(204).send();
});

module.exports = { listEmployees, createEmployee, updateEmployee, deleteEmployee };
