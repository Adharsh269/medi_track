
import { pool } from "../../config/db.js";

export async function createPatient(req, res) {
  try {
    const {
      name,
      date_of_birth,
      contact_number,
      family_member_name,
      family_member_contact,
      caretaker_id,
    } = req.body;

    // Validate patient name
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        error: "Patient name is required",
      });
    }

    // Validate date format
    if (
      typeof date_of_birth !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth)
    ) {
      return res.status(400).json({
        error: "Date of birth must be in YYYY-MM-DD format",
      });
    }

    // Validate actual date and prevent future dates
    const dob = new Date(`${date_of_birth}T00:00:00Z`);

    if (
      Number.isNaN(dob.getTime()) ||
      dob.toISOString().slice(0, 10) !== date_of_birth ||
      date_of_birth > new Date().toISOString().slice(0, 10)
    ) {
      return res.status(400).json({
        error: "Enter a valid date of birth",
      });
    }

    // Insert patient into PostgreSQL
    const result = await pool.query(
      `INSERT INTO public.patients (
        name,
        date_of_birth,
        contact_number,
        family_member_name,
        family_member_contact,
        caretaker_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        primary_id,
        name,
        date_of_birth,
        contact_number,
        family_member_name,
        family_member_contact,
        caretaker_id,
        created_at`,
      [
        name.trim(),
        date_of_birth,
        contact_number ?? null,
        family_member_name ?? null,
        family_member_contact ?? null,
        caretaker_id ?? null,
      ]
    );

    return res.status(201).json({
      message: "Patient added successfully",
      patient: result.rows[0],
    });
  } catch (error) {
    console.error("Create patient error:", error.message);

    return res.status(500).json({
      error: "Unable to add patient",
    });
  }
}
