const { supabaseAdmin } = require("../config/supabase");

async function getUserRoleFromHeader(req) {
  const userId = req.headers["x-user-id"];
  if (!userId || typeof userId !== "string") return null;

  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.role || null;
}

function requireRoles(allowedRoles) {
  return async (req, res, next) => {
    try {
      const role = await getUserRoleFromHeader(req);
      if (!role) {
        return res.status(401).json({ message: "Unauthorized: missing or invalid x-user-id" });
      }
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ message: "Forbidden: insufficient role permissions" });
      }
      req.userRole = role;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { requireRoles };
