
const FIELDS = `
  id,
  patient_id,
  dose_log_id,
  type,
  channel,
  message,
  scheduled_time,
  sent_at,
  status,
  created_at
`;

// GET /api/notifications
export async function getNotifications(req, res) {
  try {
    const { data, error } = await req.supabase
      .from("notifications")
      .select(FIELDS)
      .eq("patient_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return res.json({
      notifications: data
    });
  } catch (error) {
    console.error("Get notifications:", error.message);

    return res.status(500).json({
      error: "Failed to fetch notifications"
    });
  }
}

// GET /api/notifications/:id
export async function getNotification(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid notification ID"
      });
    }

    const { data, error } = await req.supabase
      .from("notifications")
      .select(FIELDS)
      .eq("id", id)
      .eq("patient_id", req.user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        error: "Notification not found"
      });
    }

    return res.json({
      notification: data
    });
  } catch (error) {
    console.error("Get notification:", error.message);

    return res.status(500).json({
      error: "Failed to fetch notification"
    });
  }
}


// GET /api/notifications/caretaker
export async function getCaretakerNotifications(req, res) {
  try {
    // Verify that the logged-in user is a caretaker.
    const { data: profile, error: profileError } =
      await req.supabase
        .from("profiles")
        .select("role")
        .eq("id", req.user.id)
        .single();

    if (profileError || !profile) {
      return res.status(403).json({
        error: "Profile access denied"
      });
    }

    if (profile.role !== "caretaker") {
      return res.status(403).json({
        error: "Caretaker access required"
      });
    }

    // Fetch only recipient records for this caretaker.
    const { data: recipients, error } =
      await req.supabase
        .from("notification_recipients")
        .select(`
          id,
          notification_id,
          status,
          sent_at,
          delivered_at,
          notifications (
            id,
            patient_id,
            dose_log_id,
            type,
            channel,
            message,
            scheduled_time,
            created_at
          )
        `)
        .eq("user_id", req.user.id)
        .order("id", { ascending: false })
        .limit(100);

    if (error) throw error;

    // Only missed-dose alerts belong in this inbox.
    const alerts = (recipients ?? [])
      .filter(
        (item) =>
          item.notifications?.type === "missed_alert" &&
          item.notifications?.channel === "web"
      )
      .map((item) => ({
        recipient_id: item.id,
        recipient_status: item.status,
        notification: item.notifications
      }));

    return res.json({
      count: alerts.length,
      alerts
    });
  } catch (error) {
    console.error(
      "Caretaker inbox error:",
      error.message
    );

    return res.status(500).json({
      error: "Failed to fetch caretaker notifications"
    });
  }
}

