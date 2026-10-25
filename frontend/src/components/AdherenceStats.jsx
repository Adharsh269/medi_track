export default function AdherenceStats({ doses = [] }) {
  const taken = doses.filter(
    (dose) => dose.status === "taken"
  ).length;

  const missed = doses.filter(
    (dose) => dose.status === "missed"
  ).length;

  const skipped = doses.filter(
    (dose) => dose.status === "skipped"
  ).length;

  const pending = doses.filter(
    (dose) =>
      dose.status === "pending" ||
      dose.status === "snoozed"
  ).length;

  const completed = taken + missed + skipped;

  const adherenceRate =
    completed > 0
      ? Math.round((taken / completed) * 100)
      : null;

  const stats = [
    { label: "Scheduled Doses", value: doses.length },
    { label: "Taken", value: taken },
    { label: "Missed", value: missed },
    { label: "Skipped", value: skipped },
    { label: "Pending / Snoozed", value: pending },
    {
      label: "Adherence Rate",
      value:
        adherenceRate === null
          ? "N/A"
          : `${adherenceRate}%`
    }
  ];

  return (
    <section className="adherence-section">
      <h2>Adherence Overview</h2>

      <div className="adherence-grid">
        {stats.map((stat) => (
          <div className="adherence-stat" key={stat.label}>
            <p>{stat.label}</p>
            <h3>{stat.value}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}
