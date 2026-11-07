import db from "./db/db.js";

const fakeProperties = [
  {
    chain_property_id: 1,
    title: "Marina Bay Residences — Unit 42B",
    address: "88 Marina View, Singapore 018983",
    description: "Luxury 2BR condo overlooking the bay. Rented, 5.2% gross yield.",
    valuation_usd: 1250000,
    total_shares: 125000,
    price_per_share_sun: 8_000_000,
    custodian_address: "TQn9Y2khEsLMG21TsSFqAatwYvvSCvGEh9",
    images: ["https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600"],
    docs: ["https://example.com/docs/marina-bay-deed.pdf"],
    status: "active",
  },
  {
    chain_property_id: 2,
    title: "Austin Duplex — East 12th St",
    address: "1407 E 12th St, Austin, TX 78702",
    description: "Fully renovated duplex, both units leased. Stable cashflow in growing tech corridor.",
    valuation_usd: 680000,
    total_shares: 68000,
    price_per_share_sun: 4_500_000,
    custodian_address: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
    images: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600"],
    docs: ["https://example.com/docs/austin-duplex-deed.pdf"],
    status: "active",
  },
  {
    chain_property_id: 3,
    title: "Lisbon Loft — Alfama District",
    address: "Rua de São Pedro 23, 1100-471 Lisboa",
    description: "Historic loft near the river, short-term rental license included.",
    valuation_usd: 410000,
    total_shares: 41000,
    price_per_share_sun: 3_000_000,
    custodian_address: "TJRyWwFs9wTFGZg3JbrVriFbNfCug5tDeC",
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600"],
    docs: ["https://example.com/docs/lisbon-loft-deed.pdf"],
    status: "active",
  },
  {
    chain_property_id: null,
    title: "Nairobi Commercial Plaza — Ground Floor",
    address: "Kimathi St, Nairobi, Kenya",
    description: "Retail units pending final valuation sign-off before token issuance.",
    valuation_usd: 920000,
    total_shares: 92000,
    price_per_share_sun: 6_000_000,
    custodian_address: "TBd8y6WmVbCe4xJJkK6qN3hV2Y5eHq1sZp",
    images: ["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600"],
    docs: [],
    status: "pending",
  },
];

const insert = db.prepare(`
  INSERT INTO properties
    (chain_property_id, title, address, description, valuation_usd, total_shares, price_per_share_sun, custodian_address, images, docs, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const p of fakeProperties) {
  insert.run(
    p.chain_property_id,
    p.title,
    p.address,
    p.description,
    p.valuation_usd,
    p.total_shares,
    p.price_per_share_sun,
    p.custodian_address,
    JSON.stringify(p.images),
    JSON.stringify(p.docs),
    p.status
  );
}

console.log(`Seeded ${fakeProperties.length} fake properties.`);
