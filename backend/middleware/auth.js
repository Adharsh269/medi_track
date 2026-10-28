
const { createClient } = require("@supabase/supabase-js");

function requireAuth(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header",
    });
  }

  const accessToken = authorization.slice("Bearer ".length).trim();

  if (!accessToken) {
    return res.status(401).json({
      error: "Missing access token",
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error: "Supabase environment variables are not configured",
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  async function verifyUser() {
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      return res.status(401).json({
        error: "Invalid or expired access token",
      });
    }

    req.user = data.user;
    req.supabase = supabase;

    return next();
  }

  verifyUser().catch((error) => {
    console.error("Authentication error:", error.message);

    return res.status(500).json({
      error: "Authentication verification failed",
    });
  });
}

module.exports = { requireAuth };
