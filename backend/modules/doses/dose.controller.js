
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
    // Confirm the user has a patient profile.
    await getPatientTimezone(req);

    const body = req.body;

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return res.status(400).json({
        error: "Request body must be an object"
      });
    }

    const allowedFields = [
      "status",
      "notes",
      "snoozed_until"
    ];

    if (
      Object.keys(body).some(
        key => !allowedFields.includes(key)
      )
    ) {
      return res.status(400).json({
        error: "Unknown or restricted dose field"
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
      status !== "snoozed" &&
      snoozed_until !== undefined
    ) {
      return res.status(400).json({
        error: "Snooze time is only valid for snoozed status"
      });
    }

    let snoozeTime = null;

    if (status === "snoozed") {
      if (
        typeof snoozed_until !== "string" ||
        !/([zZ]|[+-]\d{2}:\d{2})$/.test(snoozed_until)
      ) {
        return res.status(400).json({
          error: "Provide an ISO timestamp with timezone"
        });
      }

      const parsed = DateTime.fromISO(snoozed_until, {
        setZone: true
      });

      if (!parsed.isValid) {
        return res.status(400).json({
          error: "Invalid snooze timestamp"
        });
      }

      snoozeTime = parsed.toUTC().toISO();
    }

    const { data, error } = await req.supabase.rpc(
      "record_dose_response",
      {
        p_dose_id: req.params.id,
        p_status: status,
        p_notes: notes ?? null,
        p_snoozed_until: snoozeTime
      }
    );

    if (error) {
      if (error.code === "P0002") {
        return res.status(404).json({
          error: "Dose not found"
        });
      }

      if (error.code === "23514") {
        return res.status(409).json({
          error: "Dose already finalized"
        });
      }

      if (error.code === "22023") {
        return res.status(400).json({
          error: error.message
        });
      }

      if (error.code === "28000") {
        return res.status(401).json({
          error: "Authentication required"
        });
      }

      console.error("Dose RPC error:", error);

      return res.status(500).json({
        error: "Failed to update dose"
      });
    }

    return res.json({
      message: "Dose updated successfully",
      dose: data
    });

  } catch (error) {
    return sendError(res, error);
  }
}
