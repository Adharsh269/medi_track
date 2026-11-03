import { useCallback, useEffect, useState } from "react";
import {
  getTodaysDoses,
  updateDoseStatus
} from "../services/doseApi";

export default function TodayDoses() {
  const [doses, setDoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadDoses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getTodaysDoses();

      // Adjust this if your backend returns a
      // different response structure.
      const rows = Array.isArray(result)
        ? result
        : result.doses ?? [];

      setDoses(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleDoseAction(doseId, status) {
  try {
    setUpdatingId(doseId);
    setError("");

    const extra = {};

    if (status === "snoozed") {
      // Snooze for 10 minutes.
      extra.snoozed_until = new Date(
        Date.now() + 10 * 60 * 1000
      ).toISOString();
    }

    await updateDoseStatus(doseId, status, extra);

    await loadDoses();
  } catch (err) {
    setError(err.message);
  } finally {
    setUpdatingId(null);
  }
}

  useEffect(() => {
    loadDoses();
  }, [loadDoses]);

  if (loading) {
    return <p>Loading today's doses...</p>;
  }

  return (
    <section className="mt-today-doses">
      <h3 className="mt-visually-hidden">Today's Medications</h3>

      {error && (
        <p role="alert" className="mt-error">
          {error}
        </p>
      )}

      <button className="dashboard-button dashboard-button-secondary mt-small-button" onClick={loadDoses}>
        Refresh doses
      </button>

      {!error && doses.length === 0 && (
        <p>No scheduled doses found for today.</p>
      )}

      {doses.map((dose) => (
        <article key={dose.id} className="mt-today-dose-card">
          <strong>
            {dose.medications?.name ||
              dose.medication?.name ||
              "Medication"}
          </strong>

          <p>
            Scheduled:{" "}
            {new Date(
              dose.scheduled_time
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>

          <p>Status: {dose.status}</p>
          {["pending", "snoozed"].includes(dose.status) && (
        <div className="mt-dose-actions">
            <button className="dashboard-button mt-small-button"
            disabled={updatingId !== null}
            onClick={() => handleDoseAction(dose.id, "taken")}
            >
            Taken
            </button>

            <button className="dashboard-button mt-small-button"
            disabled={updatingId !== null}
            onClick={() => handleDoseAction(dose.id, "skipped")}
            >
            Skip
            </button>

            <button className="dashboard-button mt-small-button"
            disabled={updatingId !== null}
            onClick={() => handleDoseAction(dose.id, "snoozed")}
            >
            Snooze 10 min
            </button>
        </div>
        )}
        </article>
      ))}
    </section>
  );
}
