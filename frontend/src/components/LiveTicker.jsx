function shortAddr(a) {
  return a ? `${a.slice(0, 5)}…${a.slice(-4)}` : "";
}

function tickerLabel(e) {
  if (e.type === "new_listing") return `NEW LISTING — ${e.title} just listed`;
  if (e.type === "sold_out") return `SOLD OUT — ${e.title} fully funded`;
  const trx = (e.total_sun / 1_000_000).toFixed(0);
  return `${shortAddr(e.investor)} bought ${e.amount.toLocaleString()} shares of ${e.title} for ${trx} TRX`;
}

export default function LiveTicker({ events }) {
  const items = events.slice(0, 20);
  return (
    <div className="ticker">
      <div className="ticker-track">
        {items.concat(items).map((e, i) => (
          <span key={i} className={`ticker-item ${e.type} ${e.whale ? "whale" : ""}`}>
            {tickerLabel(e)}
          </span>
        ))}
      </div>
    </div>
  );
}
