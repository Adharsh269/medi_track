import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "../styles/caretaker-alerts.css";

const API_URL = "http://localhost:3000";
const PAGE_SIZE = 5;

export default function CaretakerAlerts({ patientOptions = [] }) {
  const filterId = useId();
  const [selectedPatient, setSelectedPatient] = useState("all");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [fetchedPatients, setFetchedPatients] = useState([]);
  const [patientError, setPatientError] = useState("");

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("Please log in again");
      const headers = { Authorization: `Bearer ${session.access_token}` };
      const [response, assignmentsResponse] = await Promise.all([
        fetch(`${API_URL}/api/assignments/alerts`, { headers }),
        fetch(`${API_URL}/api/assignments/me`, { headers })
      ]);
      if (assignmentsResponse.ok) {
        const assignments = await assignmentsResponse.json();
        setFetchedPatients((assignments.patients ?? []).map((entry) => ({
          id: entry.patient_id,
          name: entry.patient?.full_name || "Unknown Patient"
        })));
        setPatientError("");
      } else {
        setPatientError("Unable to refresh assigned patient names.");
      }
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Failed to fetch missed-dose alerts");
      }
      const result = await response.json();
      setAlerts(result.alerts ?? []);
      setVisibleCount(PAGE_SIZE);
    } catch (err) {
      setError(err.message || "Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [selectedPatient]);

  const assignedPatients = useMemo(() => {
    const unique = new Map();
    [...fetchedPatients, ...patientOptions].forEach((patient) => {
      if (patient?.id) unique.set(patient.id, patient);
    });
    return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [patientOptions, fetchedPatients]);

  const filteredAlerts = useMemo(() => {
    const matches = selectedPatient === "all" ? alerts : alerts.filter((a) => a.patient_id === selectedPatient);
    return [...matches].sort((a, b) => new Date(b.scheduled_time) - new Date(a.scheduled_time));
  }, [alerts, selectedPatient]);

  const patientsWithAlerts = new Set(alerts.map((a) => a.patient_id).filter(Boolean)).size;
  const visibleAlerts = filteredAlerts.slice(0, visibleCount);
  const selectedName = assignedPatients.find((p) => p.id === selectedPatient)?.name;

  return (
    <section className="dashboard-card caretaker-alerts">
      <div className="caretaker-alerts-header">
        <div><h2>Missed-Dose Alerts</h2><p className="caretaker-alerts-subtitle">Notifications for assigned patients</p></div>
        <button type="button" className="primary-button" onClick={fetchAlerts} disabled={loading}>
          {loading ? "Loading..." : "Refresh Alerts"}
        </button>
      </div>
      {error && <p role="alert" className="alerts-error">{error}</p>}
      {patientError && <p role="status" className="alerts-error">{patientError}</p>}
      <div className="alert-summary">
        <div className="alert-summary-card"><span>Total Alerts</span><strong>{alerts.length}</strong></div>
        <div className="alert-summary-card"><span>Patients With Alerts</span><strong>{patientsWithAlerts}</strong></div>
        <div className="alert-summary-card"><span>Matching Alerts</span><strong>{filteredAlerts.length}</strong></div>
      </div>
      <div className="alert-filter">
        <label htmlFor={filterId}>Filter by patient</label>
        <select id={filterId} value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)}>
          <option value="all">All Patients</option>
          {assignedPatients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
        </select>
      </div>
      {!loading && !error && filteredAlerts.length === 0 && (
        <div className="caretaker-alerts-empty" role="status">
          <strong>No missed-dose alerts</strong>
          <p>{selectedPatient === "all" ? "No missed-dose alerts for your assigned patients." : `No missed-dose alerts for ${selectedName || "this patient"}.`}</p>
        </div>
      )}
      {!loading && !error && filteredAlerts.length > 0 && (
        <>
          <div className="caretaker-alerts-list">
            {visibleAlerts.map((alert) => (
              <article className="caretaker-alert-item" key={alert.notification_id}>
                <div className="caretaker-alert-top">
                  <strong>{alert.patient_name || "Patient"}</strong>
                  <span className="caretaker-alert-badge">Missed Dose</span>
                </div>
                <p>{alert.message}</p>
                <div className="caretaker-alert-meta">
                  <time dateTime={alert.scheduled_time}>{new Date(alert.scheduled_time).toLocaleString()}</time>
                  <span>Delivery: {alert.recipient_status || "unknown"}</span>
                </div>
              </article>
            ))}
          </div>
          {filteredAlerts.length > PAGE_SIZE && (
            <div className="caretaker-alerts-pagination">
              <span>Showing {visibleAlerts.length} of {filteredAlerts.length}</span>
              <button type="button" className="primary-button" onClick={() => setVisibleCount((count) => count < filteredAlerts.length ? count + PAGE_SIZE : PAGE_SIZE)}>
                {visibleCount < filteredAlerts.length ? "Show 5 More" : "Show Less"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
