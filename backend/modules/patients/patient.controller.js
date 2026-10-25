
import { pool } from "../../config/db.js";

export const getPatients = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, role, organization_id
       FROM public.profiles
       WHERE role = $1
       ORDER BY full_name ASC`,
      ["patient"]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching patients:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
    });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, full_name, role, organization_id
       FROM public.profiles
       WHERE id = $1
         AND role = $2`,
      [id, "patient"]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching patient:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch patient",
    });
  }
};
