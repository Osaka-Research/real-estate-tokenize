export default function PropertyCard({ property, onBuy, flash }) {
  const pct = Math.min(100, property.percent_filled ?? 0);
  const soldOut = property.status === "sold_out";

  return (
    <div className={`card ${flash ? "flash" : ""} ${soldOut ? "sold-out" : ""}`}>
      <img src={property.images[0] || "https://placehold.co/400x240?text=Property"} alt={property.title} />
      <h3>{property.title}</h3>
      <p className="addr">{property.address}</p>
      <p>{property.description}</p>

      <div className="fill-bar">
        <div className="fill-bar-inner" style={{ width: `${pct}%` }} />
      </div>
      <div className="fill-stats">
        <span>{pct.toFixed(1)}% filled</span>
        <span>{property.shares_sold?.toLocaleString() ?? 0} / {property.total_shares.toLocaleString()} shares</span>
      </div>

      <div className="stats">
        <span>Valuation: ${property.valuation_usd.toLocaleString()}</span>
        <span>Price/share: {property.price_per_share_sun / 1_000_000} TRX</span>
      </div>
      <span className={`badge ${property.status}`}>{property.status.replace("_", " ")}</span>
      {property.status === "active" && (
        <button onClick={() => onBuy(property)}>Buy shares</button>
      )}
    </div>
  );
}
