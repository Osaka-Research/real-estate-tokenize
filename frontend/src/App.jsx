import { useEffect, useRef, useState } from "react";
import PropertyCard from "./components/PropertyCard.jsx";
import BuyModal from "./components/BuyModal.jsx";
import LiveTicker from "./components/LiveTicker.jsx";
import ActivityFeed from "./components/ActivityFeed.jsx";
import { connectTronLink, API_BASE } from "./tron.js";

const MAX_FEED = 60;

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [properties, setProperties] = useState([]);
  const [feed, setFeed] = useState([]);
  const [flashIds, setFlashIds] = useState({});
  const [buying, setBuying] = useState(null);
  const [error, setError] = useState("");
  const propsById = useRef(new Map());

  useEffect(() => {
    fetch(`${API_BASE}/properties`)
      .then((r) => r.json())
      .then((rows) => {
        setProperties(rows);
        for (const p of rows) propsById.current.set(p.id, p);
      })
      .catch((e) => setError(String(e)));

    fetch(`${API_BASE}/feed/recent?limit=40`)
      .then((r) => r.json())
      .then(setFeed)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const source = new EventSource(`${API_BASE}/feed/stream`);

    source.onmessage = (msg) => {
      const event = JSON.parse(msg.data);

      setFeed((prev) => [event, ...prev].slice(0, MAX_FEED));

      if (event.type === "new_listing") {
        setProperties((prev) => [
          {
            id: event.property_id,
            chain_property_id: event.chain_property_id,
            title: event.title,
            address: event.address,
            description: event.description,
            valuation_usd: event.valuation_usd,
            total_shares: event.total_shares,
            shares_sold: 0,
            price_per_share_sun: event.price_per_share_sun,
            custodian_address: "",
            images: event.images,
            docs: [],
            status: "active",
            percent_filled: 0,
          },
          ...prev,
        ]);
      } else if (event.type === "buy" || event.type === "sold_out") {
        setProperties((prev) =>
          prev.map((p) =>
            p.id === event.property_id
              ? {
                  ...p,
                  shares_sold: event.shares_sold,
                  percent_filled: event.percent_filled,
                  status: event.type === "sold_out" ? "sold_out" : p.status,
                }
              : p
          )
        );
        setFlashIds((prev) => ({ ...prev, [event.property_id]: true }));
        setTimeout(() => {
          setFlashIds((prev) => {
            const next = { ...prev };
            delete next[event.property_id];
            return next;
          });
        }, 700);
      }
    };

    source.onerror = () => {
      // EventSource auto-reconnects; nothing to do here.
    };

    return () => source.close();
  }, []);

  async function handleConnect() {
    try {
      const addr = await connectTronLink();
      setWallet(addr);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Real Estate Tokenize</h1>
        <button onClick={handleConnect}>
          {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Connect TronLink"}
        </button>
      </header>

      <LiveTicker events={feed} />

      {error && <p className="error">{error}</p>}

      <div className="layout">
        <main className="grid">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} onBuy={() => setBuying(p)} flash={flashIds[p.id]} />
          ))}
          {properties.length === 0 && <p>No properties listed yet.</p>}
        </main>
        <ActivityFeed events={feed} />
      </div>

      {buying && (
        <BuyModal
          property={buying}
          seller={buying.custodian_address}
          onClose={() => setBuying(null)}
        />
      )}
    </div>
  );
}
