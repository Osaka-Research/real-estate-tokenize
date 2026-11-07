import db from "./db/db.js";
import { broadcast } from "./feed.js";

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function fakeWallet() {
  let s = "T";
  for (let i = 0; i < 33; i++) s += B58[Math.floor(Math.random() * B58.length)];
  return s;
}

const NEW_LISTING_POOL = [
  {
    title: "Berlin Kreuzberg Loft",
    address: "Oranienstraße 27, 10999 Berlin",
    description: "Converted industrial loft, artist district, strong Airbnb demand.",
    valuation_usd: 540000,
    total_shares: 54000,
    price_per_share_sun: 3_500_000,
    images: ["https://images.unsplash.com/photo-1524230572899-a752b3835840?w=600"],
  },
  {
    title: "Bangkok Riverside Condo",
    address: "Charoen Nakhon Rd, Khlong San, Bangkok",
    description: "High floor, river view, 24/7 security, near BTS.",
    valuation_usd: 310000,
    total_shares: 31000,
    price_per_share_sun: 2_200_000,
    images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600"],
  },
  {
    title: "Dubai Marina Tower Studio",
    address: "Marina Walk, Dubai Marina, Dubai",
    description: "Furnished studio, short-term rental license, marina view.",
    valuation_usd: 450000,
    total_shares: 45000,
    price_per_share_sun: 3_000_000,
    images: ["https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600"],
  },
  {
    title: "Mexico City Roma Norte Flat",
    address: "Calle Orizaba, Roma Norte, CDMX",
    description: "Art deco building, fully leased, trendy district.",
    valuation_usd: 290000,
    total_shares: 29000,
    price_per_share_sun: 2_000_000,
    images: ["https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600"],
  },
  {
    title: "Cape Town Waterfront Unit",
    address: "Dock Rd, V&A Waterfront, Cape Town",
    description: "Ocean-facing unit, tourist hotspot, high occupancy.",
    valuation_usd: 380000,
    total_shares: 38000,
    price_per_share_sun: 2_600_000,
    images: ["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600"],
  },
  {
    title: "Tokyo Shibuya Micro-Apartment",
    address: "Udagawa-cho, Shibuya, Tokyo",
    description: "Compact unit, prime nightlife district, consistent demand.",
    valuation_usd: 520000,
    total_shares: 52000,
    price_per_share_sun: 3_400_000,
    images: ["https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600"],
  },
];

let listingPoolIdx = 0;
let nextChainId = Math.max(999, db.prepare("SELECT MAX(chain_property_id) as m FROM properties").get().m || 0) + 1;

function getNextChainId() {
  return nextChainId++;
}

function tickBuy() {
  const candidates = db
    .prepare("SELECT * FROM properties WHERE status = 'active' AND shares_sold < total_shares")
    .all();
  if (candidates.length === 0) return;

  const property = candidates[Math.floor(Math.random() * candidates.length)];
  const remaining = property.total_shares - property.shares_sold;
  if (remaining <= 0) return;

  const isWhale = Math.random() < 0.06;
  const pctBase = isWhale ? 0.01 + Math.random() * 0.04 : 0.0004 + Math.random() * 0.003;
  let amount = Math.max(1, Math.round(property.total_shares * pctBase));
  amount = Math.min(amount, remaining);

  const investor = fakeWallet();
  const totalSun = amount * property.price_per_share_sun;
  const newSold = property.shares_sold + amount;
  const soldOut = newSold >= property.total_shares;

  db.prepare("UPDATE properties SET shares_sold = ?, status = ? WHERE id = ?").run(
    newSold,
    soldOut ? "sold_out" : property.status,
    property.id
  );

  db.prepare(
    `INSERT INTO activity (property_id, type, investor, amount, price_per_share_sun, total_sun)
     VALUES (?, 'buy', ?, ?, ?, ?)`
  ).run(property.id, investor, amount, property.price_per_share_sun, totalSun);

  broadcast({
    type: soldOut ? "sold_out" : "buy",
    property_id: property.id,
    chain_property_id: property.chain_property_id,
    title: property.title,
    investor,
    amount,
    price_per_share_sun: property.price_per_share_sun,
    total_sun: totalSun,
    whale: isWhale,
    shares_sold: newSold,
    total_shares: property.total_shares,
    percent_filled: (newSold / property.total_shares) * 100,
    created_at: new Date().toISOString(),
  });
}

function tickNewListing() {
  const base = NEW_LISTING_POOL[listingPoolIdx % NEW_LISTING_POOL.length];
  listingPoolIdx++;

  const chainId = getNextChainId();
  const result = db
    .prepare(
      `INSERT INTO properties
        (chain_property_id, title, address, description, valuation_usd, total_shares, shares_sold, price_per_share_sun, custodian_address, images, docs, status)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, '[]', 'active')`
    )
    .run(
      chainId,
      base.title,
      base.address,
      base.description,
      base.valuation_usd,
      base.total_shares,
      base.price_per_share_sun,
      fakeWallet(),
      JSON.stringify(base.images)
    );

  const property = db.prepare("SELECT * FROM properties WHERE id = ?").get(result.lastInsertRowid);

  broadcast({
    type: "new_listing",
    property_id: property.id,
    chain_property_id: property.chain_property_id,
    title: property.title,
    address: property.address,
    description: property.description,
    valuation_usd: property.valuation_usd,
    total_shares: property.total_shares,
    shares_sold: 0,
    price_per_share_sun: property.price_per_share_sun,
    images: JSON.parse(property.images),
    percent_filled: 0,
    created_at: new Date().toISOString(),
  });
}

export function startSimulator() {
  function scheduleBuy() {
    tickBuy();
    setTimeout(scheduleBuy, 700 + Math.random() * 1400);
  }
  function scheduleListing() {
    tickNewListing();
    setTimeout(scheduleListing, 20000 + Math.random() * 25000);
  }
  scheduleBuy();
  scheduleListing();
}
