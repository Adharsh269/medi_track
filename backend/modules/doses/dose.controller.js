
import { DateTime } from "luxon";

const FIELDS = `
  id, medication_id, scheduled_time, status,
  actual_time_taken, snoozed_until,
  response_source, responded_at, notes,
  created_at,
  medications!inner (
    id, patient_id, name, dosage
  )
`;

async function getPatientTimezone(req) {
  const { data, error } = await req.supabase
    .from("profiles")
    .select("timezone, role")
    .eq("id", req.user.id)
    .single();

  if (error) throw error;

  if (data.role !== "patient") {
    const err = new Error("Patient access required");
    err.status = 403;
    throw err;
  }

  const zone = data.timezone || "Asia/Kolkata";

  if (!DateTime.now().setZone(zone).isValid) {
    throw new Error("Invalid profile timezone");
  }

  return zone;
}

function sendError(res, error) {
  console.error("Dose API error:", error.message);

  return res.status(error.status || 500).json({
    error: error.status
      ? error.message
      : "Unable to process dose request"
  });
}

// GET /api/doses?date=2026-11-15
// GET /api/doses/today
export async function listDoses(req, res) {
  try {
    const zone = await getPatientTimezone(req);

    const date = req.params.today === "today"
      ? DateTime.now().setZone(zone).toISODate()
      : req.query.date;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: "Provide date in YYYY-MM-DD format"
      });
    }

    const start = DateTime.fromISO(date, { zone });

    if (!start.isValid || start.toISODate() !== date) {
      return res.status(400).json({
        error: "Invalid date"
      });
    }

    const end = start.plus({ days: 1 });

    const { data, error } = await req.supabase
      .from("dose_logs")
      .select(FIELDS)
      .eq("medications.patient_id", req.user.id)
      .gte("scheduled_time", start.toUTC().toISO())
      .lt("scheduled_time", end.toUTC().toISO())
      .order("scheduled_time", { ascending: true });

    if (error) throw error;

    return res.json({
      date,
      timezone: zone,
      doses: data
    });
  } catch (error) {
    return sendError(res, error);
  }
}

// GET /api/doses/:id
export async function getDose(req, res) {
  try {
    await getPatientTimezone(req);

    const { data, error } = await req.supabase
      .from("dose_logs")
      .select(FIELDS)
      .eq("id", req.params.id)
      .eq("medications.patient_id", req.user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        error: "Dose not found"
      });
    }

    return res.json({ dose: data });
  } catch (error) {
    return sendError(res, error);
  }
}

// PATCH /api/doses/:id

export async function updateDose(req, res) {
  try {
    const body = req.body;

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return res.status(400).json({
        error: "Invalid request body"
      });
    }

    const allowed = ["status", "notes", "snoozed_until"];

    if (Object.keys(body).some(k => !allowed.includes(k))) {
      return res.status(400).json({
        error: "Unknown dose update field"
      });
    }

    const { status, notes, snoozed_until } = body;

    if (!["taken", "skipped", "snoozed"].includes(status)) {
      return res.status(400).json({
        error: "Invalid dose status"
      });
    }

    if (
      notes !== undefined &&
      notes !== null &&
      (typeof notes !== "string" || notes.length > 2000)
    ) {
      return res.status(400).json({
        error: "Invalid notes"
      });
    }

    if (
      snoozed_until !== undefined &&
      snoozed_until !== null &&
      (typeof snoozed_until !== "string" ||
       Number.isNaN(Date.parse(snoozed_until)) ||
       !/([zZ]|[+-]\d{2}:\d{2})$/.test(snoozed_until))
    ) {
      return res.status(400).json({
        error: "Invalid snooze timestamp"
      });
    }

    const { data, error } = await req.supabase.rpc(
      "respond_to_dose",
      {
        p_dose_id: req.params.id,
        p_status: status,
        p_notes: notes ?? null,
        p_snoozed_until: snoozed_until ?? null
      }
    );

    if (error) {
      console.error("Dose update:", error.message);

      const statusCode =
        error.code === "42501" ? 403 :
        error.code === "23514" ? 409 :
        error.code === "22023" ? 400 : 500;

      return res.status(statusCode).json({
        error: statusCode === 500
          ? "Failed to update dose"
          : error.message
      });
    }

    return res.json({
      message: "Dose updated successfully",
      dose: data
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
