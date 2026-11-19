
export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.supabase) {
        return res.status(401).json({
          error: "Authentication required"
        });
      }

      const { data: profile, error } = await req.supabase
        .from("profiles")
        .select("id, role, organization_id")
        .eq("id", req.user.id)
        .single();

      if (error || !profile) {
        return res.status(403).json({
          error: "Profile access denied"
        });
      }

      if (!allowedRoles.includes(profile.role)) {
        return res.status(403).json({
          error: "Insufficient permissions"
        });
      }

      req.profile = profile;
      next();
    } catch (error) {
      console.error("Role middleware error:", error);
      res.status(500).json({
        error: "Authorization failed"
      });
    }
  };
}
