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

      // validating the uuid pattern that supabase is allocated.
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

// export const getMyProfile = async(req, res) =>{
//   try {
//     const userId = req.user?.id;
//     if(!userId){
//       return res.status(401).json({
//         success:false,
//         message:"Authenticatio is failed"
//       });
//     }
//     const result = await pool.query(
//       `SELECT id, organization_id, full_name, role, phone, timezone, created_at, updated_at
//       FROM public.profiles 
//       WHERE id = $1, [userId]`
//     )
//     if (result.rows.length === 0) {
//       return res.status(404).json({
//         success:false,
//         message:"Profile is not found"
//       });
//     }
//     return res.status(200).json({
//       success:true,
//       data:result.rows[0],
//     });
//   } catch (error) {
//     console.log("Profile error:", error.message);
//     return res.status(500).json({
//       success:false,
//       message:error
//     });
//   }
// }

export const createProfiles = async(req, res) => {
  console.log("Content-Type:", req.headers["content-type"]);
  console.log("Request body:", req.body);
  try {
    const allowedRoles = ["patient", "caretaker", "family", "org_admin"];
    const{
      id,
      organization_id = null,
      full_name,
      role="patient",
      phone=null,
      timezone="Asia/Kolkata",
    } = req.body || {}
    if(!id || !full_name || typeof full_name !== "string" ) {
      return res.status(400).json({
        success:false,
        message:"Id and full name are required."
      })
    }
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if(!uuidPattern.test(id)){
      return res.status(400).json({
        success:false,
        message:"Invalid user id."
      });
    }
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role.",
      })
    }
    const   result = await pool.query(
      `INSERT INTO public.profiles
      (id, organization_id, full_name, role, phone, timezone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, organization_id, full_name, role, phone, timezone, created_at, updated_at`,
      [id, organization_id, full_name.trim(), role, phone, timezone]
    );

    return res.status(201).json({
      success:true,
      message:"Profile is successfully inserted.",
      data:result.rows[0]
    });

  } catch (error) {
    console.error("create Profile error:", error.message);
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A profile already exists for this user",
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "The user or organization does not exist",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create profile",
    });
  }
}