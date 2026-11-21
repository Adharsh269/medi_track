// backend/swagger.js

// Sample IDs for Swagger examples. Replace them with IDs from your database.
const patient = "00000000-0000-0000-0000-000000000001";
const caretaker = "00000000-0000-0000-0000-000000000002";
const admin = "00000000-0000-0000-0000-000000000003";

// Each module has one example for POST and one for PATCH.
const modules = {
  organizations: {
    create: { name: "Sunrise Care Centre" },
    update: { name: "Sunrise Advanced Care Centre" }
  },
  profiles: {
    create: { id: patient, full_name: "Demo Patient", role: "patient" },
    update: { full_name: "Updated Patient" }
  },
  "caretaker-assignments": {
    create: {
      organization_id: "1", caretaker_id: caretaker,
      patient_id: patient, assigned_by: admin
    },
    update: { status: "revoked", revoked_at: "2026-11-10T12:00:00+05:30" }
  },
  "family-contacts": {
    create: { patient_id: patient, full_name: "Demo Contact", phone: "9000000000" },
    update: { relationship: "Brother" }
  },
  medications: {
    create: {
      patient_id: patient, name: "Demo Medication", dosage: "1 tablet",
      frequency: "daily", times: ["09:00"], start_date: "2026-11-10"
    },
    update: { pills_remaining: 20 }
  },
  "dose-logs": {
    create: { medication_id: "1", scheduled_time: "2026-11-10T09:00:00+05:30" },
    update: { status: "taken", actual_time_taken: "2026-11-10T09:05:00+05:30" }
  },
  notifications: {
    create: {
      patient_id: patient, type: "reminder", message: "Demo reminder",
      scheduled_time: "2026-11-10T09:00:00+05:30"
    },
    update: { status: "sent", sent_at: "2026-11-10T09:00:01+05:30" }
  },
  "notification-recipients": {
    create: { notification_id: "1", user_id: patient },
    update: { status: "delivered", delivered_at: "2026-11-10T09:00:02+05:30" }
  },
  "adherence-scores": {
    create: {
      patient_id: patient, start_date: "2026-11-01",
      end_date: "2026-11-10", adherence_percentage: 80
    },
    update: { adherence_percentage: 90 }
  }
};

function jsonBody(example) {
  return {
    required: true,
    content: {
      "application/json": { schema: { type: "object" }, example }
    }
  };
}

const paths = {};

for (const [name, examples] of Object.entries(modules)) {
  const base = `/api/${name}`;
  const tags = [name];

  paths[base] = {
    get: {
      tags, summary: "List records",
      responses: { 200: { description: "List returned" } }
    },
    post: {
      tags, summary: "Create a record",
      requestBody: jsonBody(examples.create),
      responses: { 201: { description: "Record created" } }
    }
  };

  paths[`${base}/{id}`] = {
    parameters: [{
      name: "id", in: "path", required: true,
      schema: { type: "string" },
      description: name === "profiles" ? "Profile UUID" : "Database row ID"
    }],
    get: {
      tags, summary: "Get a record by ID",
      responses: { 200: { description: "Record returned" } }
    },
    patch: {
      tags, summary: "Update a record",
      requestBody: jsonBody(examples.update),
      responses: { 200: { description: "Record updated" } }
    }
  };
}

export default {
  openapi: "3.0.3",
  info: { title: "MediTrack Database APIs", version: "1.0.0" },
  servers: [{ url: "/" }], // Use the same host and port as the Swagger page.
  paths
};
