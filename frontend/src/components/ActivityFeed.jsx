function shortAddr(a) {
  return a ? `${a.slice(0, 5)}…${a.slice(-4)}` : "";
}

function timeAgo(iso) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

export default function ActivityFeed({ events }) {
  return (
    <aside className="feed-panel">
      <h2>Live activity</h2>
      <div className="feed-list">
        {events.map((e, i) => (
          <div key={e.id ?? i} className={`feed-row ${e.type} ${e.whale ? "whale" : ""}`}>
            {e.type === "buy" && (
              <>
                <span className="feed-main">
                  <strong>{shortAddr(e.investor)}</strong> bought{" "}
                  <strong>{e.amount.toLocaleString()}</strong> shares of {e.title}
                </span>
                <span className="feed-sub">
                  {(e.total_sun / 1_000_000).toLocaleString()} TRX · {e.percent_filled?.toFixed(1)}% filled
                  {e.whale ? " · WHALE" : ""} · {timeAgo(e.created_at)}
                </span>
              </>
            )}
            {e.type === "new_listing" && (
              <span className="feed-main new">NEW: {e.title} just listed — {e.total_shares.toLocaleString()} shares</span>
            )}
            {e.type === "sold_out" && (
              <span className="feed-main sold">SOLD OUT: {e.title} — 100% funded</span>
            )}
          </div>
        ))}
        {events.length === 0 && <p className="feed-empty">Waiting for activity…</p>}
      </div>
    </aside>
  );
}
