import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import AdherenceStats from "./AdherenceStats";
import CaretakerAlerts from "./CaretakerAlerts";
import { supabase } from "../lib/supabaseClient";
import "../styles/dashboard.css";

const API_URL = "http://localhost:3000";
const VIEWS = [
  { id: "overview", label: "Overview", icon: "▦" },
  { id: "patients", label: "Patients", icon: "♙" },
  { id: "alerts", label: "Alerts", icon: "♧" },
  { id: "medications", label: "Medications", icon: "✚" }
];

async function apiGet(path) {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session) throw new Error("Please log in again.");
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${session.access_token}` }
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed");
  return result;
}

const dateTime = (value) => value ? new Date(value).toLocaleString() : "Not available";
const timeOnly = (value) => value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Not available";
const patientName = (patient) => patient?.patient?.full_name || "Patient";
function localDateInIndia() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const field = (type) => parts.find((part) => part.type === type)?.value;
  return `${field("year")}-${field("month")}-${field("day")}`;
}

export default function CaretakerDashboard(props) {
  const [screens, setScreens] = useState([{ view: "overview", patient: null }]);
  const scrollPositions = useRef([]);

  function openScreen(view, patient) {
    const current = screens[screens.length - 1];
    if (current.view === view && current.patient?.patient_id === patient?.patient_id) return;

    scrollPositions.current[screens.length - 1] = window.scrollY;
    scrollPositions.current[screens.length] = 0;
    setScreens([...screens, { view, patient }]);
  }

  useLayoutEffect(() => {
    window.scrollTo(0, scrollPositions.current[screens.length - 1] ?? 0);
  }, [screens]);

  return screens.map((screen, index) => (
    <div key={index} hidden={index !== screens.length - 1}>
      <CaretakerScreen
        {...props}
        view={screen.view}
        initialPatient={screen.patient}
        openScreen={openScreen}
        goBack={index > 0 ? () => setScreens(screens.slice(0, -1)) : null}
      />
    </div>
  ));
}

function CaretakerScreen({ session, onLogout, loading, view, initialPatient, openScreen, goBack }) {
  const pickerId = useId();
  const [patients, setPatients] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(initialPatient);
  const [medications, setMedications] = useState([]);
  const [doses, setDoses] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const fetchPatients = useCallback(async () => {
    setFetching(true);
    setError("");
    try {
      const result = await apiGet("/api/assignments/me");
      const rows = result.patients ?? [];
      setPatients(rows);
      setSelectedPatient((current) => current ? rows.find((p) => p.patient_id === current.patient_id) ?? null : null);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients, session.user.id]);

  const loadPatientDetails = useCallback(async (patient) => {
    setSelectedPatient(patient);
    setDetailsLoading(true);
    setDetailsError("");
    setMedications([]);
    setDoses([]);
    try {
      const id = encodeURIComponent(patient.patient_id);
      const [medResult, doseResult] = await Promise.all([
        apiGet(`/api/assignments/patients/${id}/medications`),
        apiGet(`/api/assignments/patients/${id}/doses?date=${localDateInIndia()}`)
      ]);
      setMedications(medResult.medications ?? []);
      setDoses(doseResult.doses ?? []);
    } catch (err) {
      setDetailsError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  }, []);


  useEffect(() => {
    if (view === "medications" && initialPatient) {
      loadPatientDetails(initialPatient);
    }
  }, [view, initialPatient, loadPatientDetails]);

  function changeView(next) {
    openScreen(next, selectedPatient);
  }

  const patientCards = (compact = false) => (
    <div className="mt-patient-grid">
      {patients.map((patient) => (
        <article className="mt-patient-card" key={patient.id}>
          <div className="mt-patient-avatar" aria-hidden="true">{patientName(patient).charAt(0).toUpperCase()}</div>
          <div className="mt-patient-copy">
            <h3>{patientName(patient)}</h3>
            <span className="mt-chip mt-chip-green">{patient.status}</span>
            {!compact && <p>Assigned {dateTime(patient.assigned_at)}</p>}
          </div>
          <button className="dashboard-button mt-small-button" onClick={() => openScreen("medications", patient)}>View details</button>
        </article>
      ))}
    </div>
  );

  const heading = VIEWS.find((item) => item.id === view)?.label;

  return (
    <main className="mt-shell dashboard-page">
      <aside className="mt-sidebar">
        <div className="mt-brand"><span className="mt-brand-symbol">✚</span><span>MedicTrack</span></div>
        <div className="mt-sidebar-caption">CARETAKER WORKSPACE</div>
        <nav className="mt-nav" aria-label="Dashboard sections">
          {VIEWS.map((item) => (
            <button key={item.id} type="button" className={`mt-nav-button ${view === item.id ? "is-active" : ""}`} onClick={() => changeView(item.id)} aria-current={view === item.id ? "page" : undefined}>
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="mt-sidebar-bottom">
          <div className="mt-account">{session.user.email}</div>
          <button className="mt-logout" onClick={onLogout} disabled={loading}>Log out</button>
        </div>
      </aside>
      <div className="mt-main">
        <header className="mt-topbar">
          <div><div className="mt-eyebrow">Caretaker dashboard</div>
          {goBack && (
            <button
              type="button"
              className="dashboard-button dashboard-button-secondary mt-small-button"
              style={{ display: "block", margin: "8px 0" }}
              onClick={goBack}
            >
              ← Back
            </button>
          )}
          <h1>{heading}</h1></div>
          <span className="mt-topbar-user">{session.user.email}</span>
        </header>
        {error && <p role="alert" className="mt-error">{error}</p>}
        {fetching && <p className="mt-muted">Loading patients...</p>}

        {view === "overview" && (
          <>
            <section className="mt-metrics">
              <div className="mt-metric"><span>Assigned patients</span><strong>{patients.length}</strong><small>Under your care</small></div>
              <div className="mt-metric"><span>Active assignments</span><strong>{patients.filter((p) => p.status === "active").length}</strong><small>Currently active</small></div>
              <div className="mt-metric"><span>Selected patient</span><strong className="mt-metric-name">{selectedPatient ? patientName(selectedPatient) : "None"}</strong><small>Open a patient to review doses</small></div>
            </section>
            <section className="dashboard-card mt-panel">
              <div className="mt-section-header"><div><h2>Assigned patients</h2><p>Select a patient to review their medications and adherence.</p></div><button className="dashboard-button dashboard-button-secondary mt-small-button" onClick={fetchPatients} disabled={fetching}>Refresh</button></div>
              {!fetching && patients.length === 0 && <p>No patients assigned yet.</p>}
              {patientCards(true)}
              {patients.length > 0 && <button className="mt-text-button" onClick={() => changeView("patients")}>View all patients →</button>}
            </section>
            <section className="dashboard-card mt-panel mt-overview-alerts">
              <div className="mt-section-header"><div><h2>Missed-dose alerts</h2><p>Review recent alerts for your assigned patients.</p></div><button className="dashboard-button mt-small-button" onClick={() => changeView("alerts")}>Open alerts</button></div>
              <p className="mt-muted">Open Alerts to view the notification list, patient filter and delivery status.</p>
            </section>
          </>
        )}

        {view === "patients" && (
          <section className="dashboard-card mt-panel">
            <div className="mt-section-header"><div><h2>My assigned patients</h2><p>{patients.length} patients</p></div><button className="dashboard-button dashboard-button-secondary mt-small-button" onClick={fetchPatients} disabled={fetching}>Refresh patients</button></div>
            {!fetching && patients.length === 0 && <p>No patients assigned yet.</p>}
            {patientCards()}
          </section>
        )}

        {view === "alerts" && <div className="mt-alerts-view"><CaretakerAlerts patients={patients} /></div>}

        {view === "medications" && (
          <>
            <section className="dashboard-card mt-panel">
              <div className="mt-section-header"><div><h2>Patient medications</h2><p>Select a patient to see today's doses and adherence.</p></div></div>
              <div className="mt-picker-row">
                <label htmlFor={pickerId}>Patient</label>
                <select id={pickerId} value={selectedPatient?.patient_id ?? ""} onChange={(event) => {
                  const patient = patients.find((p) => p.patient_id === event.target.value);
                  openScreen("medications", patient ?? null);
                }}>
                  <option value="">Choose a patient</option>
                  {patients.map((patient) => <option key={patient.id} value={patient.patient_id}>{patientName(patient)}</option>)}
                </select>
                {selectedPatient && <button className="dashboard-button mt-small-button" disabled={detailsLoading} onClick={() => loadPatientDetails(selectedPatient)}>Refresh details</button>}
              </div>
            </section>
            {selectedPatient && (
              <>
                {detailsLoading && <p className="mt-muted">Loading patient details...</p>}
                {detailsError && <p className="mt-error" role="alert">{detailsError}</p>}
                {!detailsLoading && !detailsError && (
                  <>
                    <section className="dashboard-card mt-panel"><div className="mt-section-header"><h2>{patientName(selectedPatient)} · Adherence overview</h2></div><AdherenceStats doses={doses} /></section>
                    <section className="dashboard-card mt-panel"><div className="mt-section-header"><h2>Medications <span className="mt-count">{medications.length}</span></h2></div>
                      {medications.length === 0 ? <p>No medications found.</p> : <div className="mt-med-grid">{medications.map((med) => (
                        <article className="mt-med-card" key={med.id}><div className="mt-med-heading"><span className="mt-med-icon">✚</span><h3>{med.name}</h3><span className={`mt-chip ${med.active ? "mt-chip-green" : ""}`}>{med.active ? "Active" : "Inactive"}</span></div><p><strong>Dosage</strong><span>{med.dosage || "Not specified"}</span></p><p><strong>Frequency</strong><span>{med.frequency || "Not specified"}</span></p><p><strong>Times</strong><span>{med.times?.join(", ") || "Not specified"}</span></p></article>
                      ))}</div>}
                    </section>
                    <section className="dashboard-card mt-panel"><div className="mt-section-header"><h2>Today's scheduled doses <span className="mt-count">{doses.length}</span></h2></div>
                      {doses.length === 0 ? <p>No doses found for today.</p> : <div className="mt-dose-list">{doses.map((dose) => (
                        <article className="mt-dose-row" key={dose.id}><div><strong>{dose.medications?.name || dose.medication?.name || `Medication #${dose.medication_id}`}</strong><p>{dateTime(dose.scheduled_time)}</p></div><div className="mt-dose-right"><span>{timeOnly(dose.scheduled_time)}</span><span className={`mt-chip ${dose.status === "taken" ? "mt-chip-green" : dose.status === "missed" ? "mt-chip-red" : ""}`}>{dose.status}</span></div></article>
                      ))}</div>}
                    </section>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
