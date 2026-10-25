import { pool } from "../../config/db.js";

export const getProfiles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        organization_id,
        full_name,
        role,
        phone,
        timezone,
        created_at,
        updated_at
      FROM public.profiles
      ORDER BY created_at DESC
      LIMIT 100
    `);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("getProfiles error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve profiles",
    });
  }
};

export const getProfileById = async (req, res) => {
    try {
      const { id } = req.params;

      // Validate UUID format before querying PostgreSQL.
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (!uuidPattern.test(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid profile UUID",
        });
      }

      const result = await pool.query(
        `SELECT
          id,
          organization_id,
          full_name,
          role,
          phone,
          timezone,
          created_at,
          updated_at
        FROM public.profiles
        WHERE id = $1`,
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Profile not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error("getProfileById error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve profile",
      });
    }
  };
