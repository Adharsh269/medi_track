
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
        status
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

