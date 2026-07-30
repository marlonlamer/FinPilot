export default function DashboardHeader({ displayName, greeting, formattedDate }) {
  return (
    <div className="dashboard-header">
      <div className="dashboard-greeting">
        <h1>{greeting}, {displayName} <span className="wave">👋</span></h1>
        <div className="dashboard-date">{formattedDate}</div>
      </div>
      <div className="dashboard-subtext">Track your finances and stay on top of your goals.</div>
    </div>
  );
}
