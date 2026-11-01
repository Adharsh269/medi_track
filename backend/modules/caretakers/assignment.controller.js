import { DateTime } from "luxon";



async function getProfile(req) {
  const { data, error } = await req.supabase
    .from("profiles")
    .select("id, role, organization_id")
    .eq("id", req.user.id)
    .single();

  if (error) throw error;

  return data;
}

// GET /api/assignments/me
export async function getMyPatients(req, res) {
  try {
    const profile = await getProfile(req);

    if (profile.role !== "caretaker") {
      return res.status(403).json({
        error: "Caretaker access required"
      });
    }

    if (!profile.organization_id) {
      return res.status(403).json({
        error: "No organization assigned"
      });
    }

    const { data, error } = await req.supabase
      .from("caretaker_assignments")
      .select(`
        id,
        patient_id,
        assigned_at,
        status,
        patient:profiles!caretaker_assignments_patient_id_fkey (
          id,
          full_name
        )
      `)
      .eq("caretaker_id", req.user.id)
      .eq("organization_id", profile.organization_id)
      .eq("status", "active")
      .order("assigned_at", { ascending: false });

    if (error) throw error;

    return res.json({
      patients: data
    });

  } catch (error) {
    console.error("Get patients:", error.message);

    return res.status(500).json({
      error: "Failed to fetch assigned patients"
    });
  }
}

// GET /api/assignments
export async function getAssignments(req, res) {
  try {
    const profile = await getProfile(req);

    if (profile.role !== "org_admin") {
      return res.status(403).json({
        error: "Organization admin access required"
      });
    }

    if (!profile.organization_id) {
      return res.status(403).json({
        error: "No organization assigned"
      });
    }

    const { data, error } = await req.supabase
      .from("caretaker_assignments")
      .select(`
        id,
        caretaker_id,
        patient_id,
        status,
        assigned_at,
        revoked_at
      `)
      .eq("organization_id", profile.organization_id)
      .order("assigned_at", { ascending: false });

    if (error) throw error;

    return res.json({
      assignments: data
    });
  } catch (error) {
    console.error("Get assignments:", error.message);

    return res.status(500).json({
      error: "Failed to fetch assignments"
    });
  }
}
// Create Assignment
export async function createAssignment(req, res) {
  try {
    const { caretaker_id, patient_id } = req.body ?? {};

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (
      typeof caretaker_id !== "string" ||
      typeof patient_id !== "string" ||
      !uuidPattern.test(caretaker_id) ||
      !uuidPattern.test(patient_id)
    ) {
      return res.status(400).json({
        error: "Valid caretaker_id and patient_id are required"
      });
    }

    const { data, error } = await req.supabase.rpc(
      "assign_caretaker",
      {
        p_caretaker_id: caretaker_id,
        p_patient_id: patient_id
      }
    );

    if (error) {
      const status =
        error.code === "42501" ? 403 :
        error.code === "23505" ? 409 :
        error.code === "22023" ? 400 : 500;

      return res.status(status).json({
        error: status === 500
          ? "Failed to create assignment"
          : error.message
      });
    }

    return res.status(201).json({
      message: "Caretaker assigned successfully",
      assignment_id: data
    });
  } catch (error) {
    console.error("Create assignment:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}

//Revoke assignment
export async function revokeAssignment(req, res) {
  try {
    if (!/^\d+$/.test(req.params.id)) {
      return res.status(400).json({
        error: "Invalid assignment ID"
      });
    }

    const { data, error } = await req.supabase.rpc(
      "revoke_caretaker_assignment",
      {
        p_assignment_id: Number(req.params.id)
      }
    );

    if (error) {
      const status =
        error.code === "42501" ? 403 :
        error.code === "P0002" ? 404 : 500;

      return res.status(status).json({
        error: status === 500
          ? "Failed to revoke assignment"
          : error.message
      });
    }

    return res.json({
      message: "Assignment revoked successfully",
      revoked: data
    });
  } catch (error) {
    console.error("Revoke assignment:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}

// GET /api/assignments/patients/:patientId
export async function getAssignedPatientDetails(req, res) {
  try {
    const { patientId } = req.params;

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(patientId)) {
      return res.status(400).json({
        error: "Invalid patient ID"
      });
    }

    const profile = await getProfile(req);

    if (profile.role !== "caretaker") {
      return res.status(403).json({
        error: "Caretaker access required"
      });
    }

    if (!profile.organization_id) {
      return res.status(403).json({
        error: "No organization assigned"
      });
    }

    const { data: assignment, error } = await req.supabase
      .from("caretaker_assignments")
      .select(`
        id,
        patient_id,
        assigned_at,
        status,
        patient:profiles!caretaker_assignments_patient_id_fkey (
          id,
          full_name
        )
      `)
      .eq("caretaker_id", req.user.id)
      .eq("patient_id", patientId)
      .eq("organization_id", profile.organization_id)
      .eq("status", "active")
      .maybeSingle();

    if (error) throw error;

    if (!assignment) {
      return res.status(404).json({
        error: "Assigned patient not found"
      });
    }

    return res.json({ patient: assignment });

  } catch (error) {
    console.error("Get assigned patient details:", error);

    return res.status(500).json({
      error: "Failed to fetch patient details"
    });
  }
}


 // GET /api/assignments/patients/:patientId/medications
export async function getAssignedPatientMedications(req, res) {
  try {
    const { patientId } = req.params;

    console.log("Received patientId:", req.params.patientId);

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(patientId)) {
      return res.status(400).json({
        error: "Invalid patient ID"
      });
    }

    const profile = await getProfile(req);

    if (
      profile.role !== "caretaker" ||
      !profile.organization_id
    ) {
      return res.status(403).json({
        error: "Caretaker access required"
      });
    }

    // Verify active caretaker assignment
    const { data: assignment, error: assignmentError } =
      await req.supabase
        .from("caretaker_assignments")
        .select("id")
        .eq("caretaker_id", req.user.id)
        .eq("patient_id", patientId)
        .eq("organization_id", profile.organization_id)
        .eq("status", "active")
        .maybeSingle();

    if (assignmentError) throw assignmentError;

    if (!assignment) {
      return res.status(404).json({
        error: "Assigned patient not found"
      });
    }

    // Fetch assigned patient's medications
    const { data: medications, error: medicationError } =
      await req.supabase
        .from("medications")
        .select(`
          id,
          name,
          dosage,
          frequency,
          times,
          start_date,
          end_date,
          active
        `)
        .eq("patient_id", patientId)
        .eq("active", true)
        .order("name", { ascending: true });

    if (medicationError) throw medicationError;

    return res.json({
      patient_id: patientId,
      medications
    });

  } catch (error) {
    console.error(
      "Get assigned patient medications:",
      error
    );

    return res.status(500).json({
      error: "Failed to fetch patient medications"
    });
  }
}

 // GET /api/assignments/patients/:patientId/doses?date=YYYY-MM-DD
export async function getAssignedPatientDoses(req, res) {
  try {
    const { patientId } = req.params;
    const { date } = req.query;

    const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(patientId)) {
      return res.status(400).json({
        error: "Invalid patient ID"
      });
    }

    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return res.status(400).json({
        error: "Date must be YYYY-MM-DD"
      });
    }

    const profile = await getProfile(req);

    if (
      profile.role !== "caretaker" ||
      !profile.organization_id
    ) {
      return res.status(403).json({
        error: "Caretaker access required"
      });
    }

    // Verify active caretaker assignment
    const { data: assignment, error: assignmentError } =
      await req.supabase
        .from("caretaker_assignments")
        .select("id")
        .eq("caretaker_id", req.user.id)
        .eq("patient_id", patientId)
        .eq("organization_id", profile.organization_id)
        .eq("status", "active")
        .maybeSingle();

    if (assignmentError) throw assignmentError;

    if (!assignment) {
      return res.status(404).json({
        error: "Assigned patient not found"
      });
    }

    // Read patient's timezone
    const { data: patient, error: patientError } =
      await req.supabase
        .from("profiles")
        .select("timezone")
        .eq("id", patientId)
        .single();

    if (patientError) throw patientError;

    const timezone = patient.timezone || "Asia/Kolkata";

    // Convert the patient's calendar date to UTC boundaries
    const start = DateTime.fromISO(date, {
      zone: timezone
    }).startOf("day");

    if (!start.isValid || start.toISODate() !== date) {
      return res.status(400).json({
        error: "Invalid date or patient timezone"
      });
    }

    const end = start.plus({ days: 1 });

    // Fetch doses for the selected patient and date
    const { data: doses, error: doseError } =
      await req.supabase
        .from("dose_logs")
        .select(`
          id,
          medication_id,
          scheduled_time,
          status,
          actual_time_taken,
          snoozed_until,
          medications!inner (
            id,
            name,
            dosage,
            patient_id
          )
        `)
        .eq("medications.patient_id", patientId)
        .gte("scheduled_time", start.toUTC().toISO())
        .lt("scheduled_time", end.toUTC().toISO())
        .order("scheduled_time", { ascending: true });

    if (doseError) throw doseError;

    return res.json({
      patient_id: patientId,
      date,
      timezone,
      doses: doses || []
    });

  } catch (error) {
    console.error("Get assigned patient doses:", error);

    return res.status(500).json({
      error: "Failed to fetch patient doses"
    });
  }
}

// GET /api/assignments/alerts
export async function getCaretakerAlerts(req, res) {
  try {
    const { data, error } = await req.supabase.rpc(
      "get_caretaker_missed_alerts"
    );

    if (error) {
      console.error("Fetch caretaker alerts:", error);
      return res.status(500).json({
        error: "Failed to fetch caretaker alerts"
      });
    }

    return res.json({
      alerts: data ?? []
    });
  } catch (error) {
    console.error("Caretaker alerts:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}





