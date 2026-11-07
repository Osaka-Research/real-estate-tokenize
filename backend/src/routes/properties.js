import { Router } from "express";
import { z } from "zod";
import db from "../db/db.js";

const router = Router();

const propertySchema = z.object({
  title: z.string().min(1),
  address: z.string().min(1),
  description: z.string().optional(),
  valuation_usd: z.number().positive(),
  total_shares: z.number().int().positive(),
  price_per_share_sun: z.number().int().positive(),
  custodian_address: z.string().min(1),
  images: z.array(z.string()).optional(),
  docs: z.array(z.string()).optional(),
});

// List all properties (metadata the dapp/contract's `uri()` points to, plus off-chain filters)
router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM properties ORDER BY created_at DESC").all();
  res.json(rows.map(deserialize));
});

router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM properties WHERE id = ? OR chain_property_id = ?").get(req.params.id, req.params.id);
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(deserialize(row));
});

// Create draft listing (status=pending) before on-chain issueProperty() call
router.post("/", (req, res) => {
  const parsed = propertySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const data = parsed.data;
  const result = db
    .prepare(
      `INSERT INTO properties
        (title, address, description, valuation_usd, total_shares, price_per_share_sun, custodian_address, images, docs, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    )
    .run(
      data.title,
      data.address,
      data.description ?? "",
      data.valuation_usd,
      data.total_shares,
      data.price_per_share_sun,
      data.custodian_address,
      JSON.stringify(data.images ?? []),
      JSON.stringify(data.docs ?? [])
    );

  res.status(201).json(deserialize(db.prepare("SELECT * FROM properties WHERE id = ?").get(result.lastInsertRowid)));
});

// Attach the on-chain propertyId once issueProperty() tx confirms, activating the listing
router.patch("/:id/activate", (req, res) => {
  const { chain_property_id } = req.body;
  if (!chain_property_id) return res.status(400).json({ error: "chain_property_id required" });

  db.prepare("UPDATE properties SET chain_property_id = ?, status = 'active' WHERE id = ?").run(chain_property_id, req.params.id);
  res.json({ ok: true });
});

// Serves TRC-1155 metadata URI format: {baseURI}/{id}.json
router.get("/:id/metadata.json", (req, res) => {
  const row = db.prepare("SELECT * FROM properties WHERE chain_property_id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "not found" });
  const p = deserialize(row);
  res.json({
    name: p.title,
    description: p.description,
    image: p.images[0] ?? "",
    properties: {
      address: p.address,
      valuation_usd: p.valuation_usd,
      total_shares: p.total_shares,
      price_per_share_sun: p.price_per_share_sun,
      docs: p.docs,
    },
  });
});

function deserialize(row) {
  const shares_sold = row.shares_sold || 0;
  return {
    ...row,
    shares_sold,
    images: JSON.parse(row.images || "[]"),
    docs: JSON.parse(row.docs || "[]"),
    percent_filled: row.total_shares ? (shares_sold / row.total_shares) * 100 : 0,
  };
}

export default router;
