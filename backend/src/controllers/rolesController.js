const { supabaseAdmin } = require("../config/supabase");
const { asyncHandler } = require("../utils/asyncHandler");

const listRoles = asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin.from("roles").select("*").order("title");
  if (error) throw error;
  res.json(data || []);
});

module.exports = { listRoles };
