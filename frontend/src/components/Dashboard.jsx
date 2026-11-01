import { useState } from "react";
import TodayDoses from "./TodayDoses";
import { subscribeToPush } from "../services/pushSubscription";
import { requestNotificationPermission, showBrowserNotification } from "../services/browserNotification";
import "../styles/dashboard.css";

export default function Dashboard({ session, onLogout, loading }) {
  const [view, setView] = useState("overview");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function enableReminders() {
    setBusy(true);
    try { const result = await subscribeToPush(); setNotificationMessage(result.message); }
    catch (error) { setNotificationMessage(error.message); }
    finally { setBusy(false); }
  }

  async function testBrowserNotification() {
    setBusy(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission !== "granted") { setNotificationMessage("Please allow notifications in your browser."); return; }
      await showBrowserNotification({ title: "MedicTrack Medication Reminder", body: "It's time to take your medication." });
      setNotificationMessage("Test notification requested successfully!");
    } catch (error) { setNotificationMessage(error.message); }
    finally { setBusy(false); }
  }

  return (
    <main className="mt-shell dashboard-page">
      <aside className="mt-sidebar">
        <div className="mt-brand"><span className="mt-brand-symbol">✚</span><span>MedicTrack</span></div>
        <div className="mt-sidebar-caption">PATIENT WORKSPACE</div>
        <nav className="mt-nav" aria-label="Dashboard sections">
          <button className={`mt-nav-button ${view === "overview" ? "is-active" : ""}`} onClick={() => setView("overview")}>▦ Overview</button>
          <button className={`mt-nav-button ${view === "doses" ? "is-active" : ""}`} onClick={() => setView("doses")}>✚ Today's doses</button>
          <button className={`mt-nav-button ${view === "reminders" ? "is-active" : ""}`} onClick={() => setView("reminders")}>♧ Reminders</button>
        </nav>
        <div className="mt-sidebar-bottom"><div className="mt-account">{session.user.email}</div><button className="mt-logout" onClick={onLogout} disabled={loading}>Log out</button></div>
      </aside>
      <div className="mt-main">
        <header className="mt-topbar"><div><div className="mt-eyebrow">Patient dashboard</div><h1>{view === "overview" ? "Overview" : view === "doses" ? "Today's doses" : "Reminders"}</h1></div><span className="mt-topbar-user">{session.user.email}</span></header>
        {view === "overview" && <><section className="dashboard-card mt-panel"><h2>Welcome to MedicTrack</h2><p className="mt-muted">Review your medication schedule and manage reminders from one place.</p><div className="mt-quick-actions"><button className="dashboard-button" onClick={() => setView("doses")}>View today's doses</button><button className="dashboard-button dashboard-button-secondary" onClick={() => setView("reminders")}>Reminder settings</button></div></section><section className="dashboard-card mt-panel"><h2>Today's medications</h2><TodayDoses /></section></>}
        {view === "doses" && <section className="dashboard-card mt-panel"><h2>Today's medications</h2><TodayDoses /></section>}
        {view === "reminders" && <section className="dashboard-card mt-panel"><h2>Medication notifications</h2><p className="mt-muted">Enable push reminders or check whether your browser can display notifications.</p><div className="mt-quick-actions"><button className="dashboard-button" onClick={enableReminders} disabled={busy}>Enable automatic reminders</button><button className="dashboard-button dashboard-button-secondary" onClick={testBrowserNotification} disabled={busy}>Test browser notification</button></div>{notificationMessage && <p role="status" className="mt-feedback">{notificationMessage}</p>}</section>}
      </div>
    </main>
  );
}
