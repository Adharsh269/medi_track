
const FIELDS = `
  id, patient_id, name, dosage, frequency,
  times, start_date, end_date, pills_remaining,
  refill_threshold, active, created_at, updated_at
`;

function validateMedication(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be an object";
  }

  const allowed = [
    "name", "dosage", "frequency", "times",
    "start_date", "end_date", "pills_remaining",
    "refill_threshold", "active"
  ];

  if (Object.keys(body).some(key => !allowed.includes(key))) {
    return "Unknown or restricted medication field";
  }

  for (const field of ["name", "dosage", "frequency"]) {
    if (field in body &&
        (typeof body[field] !== "string" || !body[field].trim())) {
      return `${field} must be a nonempty string`;
    }
  }

  if ("times" in body &&
      (!Array.isArray(body.times) ||
       body.times.length === 0 ||
       !body.times.every(t =>
         typeof t === "string" &&
         /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(t)
       ))) {
    return "times must contain valid HH:MM values";
  }

  for (const field of ["start_date", "end_date"]) {
    if (field in body &&
        !(field === "end_date" && body[field] === null) &&
        (typeof body[field] !== "string" ||
         !/^\d{4}-\d{2}-\d{2}$/.test(body[field]) ||
         Number.isNaN(Date.parse(body[field])) ||
         new Date(body[field]).toISOString().slice(0, 10) !== body[field])) {
      return `${field} must be a valid YYYY-MM-DD date`;
    }
  }

  for (const field of ["pills_remaining", "refill_threshold"]) {
    if (field in body &&
        !(field === "pills_remaining" && body[field] === null) &&
        (!Number.isInteger(body[field]) || body[field] < 0)) {
      return `${field} must be a nonnegative integer`;
    }
  }

  if ("active" in body && typeof body.active !== "boolean") {
    return "active must be a boolean";
  }

  if (body.start_date && body.end_date &&
      body.end_date < body.start_date) {
    return "end_date cannot precede start_date";
  }

  return null;
}

// GET /api/medications
export async function getMedications(req, res) {
  const { data, error } = await req.supabase
    .from("medications")
    .select(FIELDS)
    .eq("patient_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Failed to fetch medications" });
  }

  return res.json({ medications: data });
}

// GET /api/medications/:id
export async function getMedication(req, res) {
  const { data, error } = await req.supabase
    .from("medications")
    .select(FIELDS)
    .eq("id", req.params.id)
    .eq("patient_id", req.user.id)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: "Failed to fetch medication" });
  }

  if (!data) {
    return res.status(404).json({ error: "Medication not found" });
  }

  return res.json({ medication: data });
}

// POST /api/medications
export async function createMedication(req, res) {
  const validationError = validateMedication(req.body);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const required = ["name", "dosage", "frequency", "times", "start_date"];

  if (required.some(field => !(field in req.body))) {
    return res.status(400).json({
      error: `Required fields: ${required.join(", ")}`
    });
  }

  const payload = {
    ...req.body,
    patient_id: req.user.id
  };

  const { data, error } = await req.supabase
    .from("medications")
    .insert(payload)
    .select(FIELDS)
    .single();

  if (error) {
  console.error("Medication creation failed:", {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint
  });

  return res.status(500).json({
    error: "Failed to create medication"
  });
}

  return res.status(201).json({
    message: "Medication created successfully",
    medication: data
  });
}

// PATCH /api/medications/:id
export async function updateMedication(req, res) {
  const validationError = validateMedication(req.body);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "No fields provided" });
  }

  // Check the existing date values before a partial update.
  const { data: existing, error: readError } = await req.supabase
    .from("medications")
    .select("start_date, end_date")
    .eq("id", req.params.id)
    .eq("patient_id", req.user.id)
    .maybeSingle();

  if (readError) {
    return res.status(500).json({ error: "Failed to read medication" });
  }

  if (!existing) {
    return res.status(404).json({ error: "Medication not found" });
  }

  const start = req.body.start_date ?? existing.start_date;
  const end = "end_date" in req.body
    ? req.body.end_date
    : existing.end_date;

  if (end && end < start) {
    return res.status(400).json({
      error: "end_date cannot precede start_date"
    });
  }

  const { data, error } = await req.supabase
    .from("medications")
    .update(req.body)
    .eq("id", req.params.id)
    .eq("patient_id", req.user.id)
    .select(FIELDS)
    .maybeSingle();

  if (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Failed to update medication" });
  }

  if (!data) {
    return res.status(404).json({ error: "Medication not found" });
  }

  return res.json({
    message: "Medication updated successfully",
    medication: data
  });
}

// DELETE /api/medications/:id
// Soft delete: preserve history for dose logs.
export async function deleteMedication(req, res) {
  const { data, error } = await req.supabase
    .from("medications")
    .update({ active: false })
    .eq("id", req.params.id)
    .eq("patient_id", req.user.id)
    .select("id, active")
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: "Failed to deactivate medication" });
  }

  if (!data) {
    return res.status(404).json({ error: "Medication not found" });
  }

  return res.json({
    message: "Medication deactivated successfully",
    medication: data
  });
}
