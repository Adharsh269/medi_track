
import { supabase } from "../lib/supabaseClient";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

async function apiRequest(path, options = {}) {
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;

  if (!session?.access_token) {
    throw new Error("Please log in again.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || result.message || "Request failed"
    );
  }

  return result;
}

export async function getTodaysDoses() {
  return apiRequest("/api/doses/today");
}

export async function updateDoseStatus(
  doseId,
  status,
  extra = {}
) {
  return apiRequest(`/api/doses/${doseId}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      ...extra
    })
  });
}
