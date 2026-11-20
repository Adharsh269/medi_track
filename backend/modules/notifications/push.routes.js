
import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

function adminClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}

router.post("/subscribe", requireAuth, async (req, res) => {
  try {
    const subscription = req.body;

    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const auth = subscription?.keys?.auth;

    if (
      typeof endpoint !== "string" ||
      typeof p256dh !== "string" ||
      typeof auth !== "string" ||
      !endpoint.startsWith("https://") ||
      endpoint.length > 4096 ||
      !p256dh ||
      !auth
    ) {
      return res.status(400).json({
        error: "Invalid push subscription"
      });
    }

    const db = adminClient();

    // Never transfer an existing subscription to another user.
    const { data: existing, error: lookupError } =
      await db
        .from("push_subscriptions")
        .select("user_id")
        .eq("endpoint", endpoint)
        .maybeSingle();

    if (lookupError) throw lookupError;

    if (existing && existing.user_id !== req.user.id) {
      return res.status(409).json({
        error: "Subscription already belongs to another user"
      });
    }

    const { error } = await db
      .from("push_subscriptions")
      .upsert(
        {
          user_id: req.user.id,
          endpoint,
          p256dh,
          auth,
          updated_at: new Date().toISOString()
        },
        { onConflict: "endpoint" }
      );

    if (error) throw error;

    return res.json({
      success: true,
      message: "Browser registered for notifications"
    });
  } catch (error) {
    console.error("Push subscription error:", error);
    return res.status(500).json({
      error: "Failed to register browser"
    });
  }
});

export default router;
