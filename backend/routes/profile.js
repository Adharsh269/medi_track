
const express = require("express");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const PROFILE_FIELDS =
  "id, organization_id, full_name, role, phone, timezone, created_at, updated_at";

// GET /api/me
// Return the authenticated user's profile.
router.get("/me", requireAuth, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("profiles")
      .select(PROFILE_FIELDS)
      .eq("id", req.user.id)
      .maybeSingle();

    if (error) {
      console.error("Profile fetch error:", error.message);

      return res.status(500).json({
        error: "Failed to fetch profile",
      });
    }

    if (!data) {
      return res.status(404).json({
        error: "Profile not found. Check your profile creation trigger.",
      });
    }

    return res.json({ profile: data });
  } catch (error) {
    console.error("Unexpected profile error:", error.message);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// PATCH /api/me
// Update only permitted profile fields.
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const allowedFields = ["full_name", "phone", "timezone"];
    const updates = req.body;

    if (
      !updates ||
      typeof updates !== "object" ||
      Array.isArray(updates)
    ) {
      return res.status(400).json({
        error: "Request body must be a JSON object",
      });
    }

    const keys = Object.keys(updates);

    if (keys.length === 0) {
      return res.status(400).json({
        error: "Provide at least one field to update",
      });
    }

    const invalidFields = keys.filter(
      (key) => !allowedFields.includes(key)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        error: "One or more fields cannot be updated",
        invalidFields,
      });
    }

    for (const field of keys) {
      const value = updates[field];

      if (value !== null && typeof value !== "string") {
        return res.status(400).json({
          error: `${field} must be a string or null`,
        });
      }
    }

    if (
      updates.full_name !== undefined &&
      (!updates.full_name || !updates.full_name.trim())
    ) {
      return res.status(400).json({
        error: "full_name cannot be empty",
      });
    }

    const { data, error } = await req.supabase
      .from("profiles")
      .update(updates)
      .eq("id", req.user.id)
      .select(PROFILE_FIELDS)
      .maybeSingle();

    if (error) {
      console.error("Profile update error:", error.message);

      return res.status(500).json({
        error: "Failed to update profile",
      });
    }

    if (!data) {
      return res.status(404).json({
        error: "Profile not found or update not permitted",
      });
    }

    return res.json({
      message: "Profile updated successfully",
      profile: data,
    });
  } catch (error) {
    console.error("Unexpected profile error:", error.message);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

module.exports = router;
