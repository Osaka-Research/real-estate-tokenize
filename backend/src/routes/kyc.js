import { Router } from "express";
import { createHash } from "node:crypto";
import { z } from "zod";
import db from "../db/db.js";

const router = Router();

const kycSchema = z.object({
  wallet_address: z.string().min(1),
  full_name: z.string().min(1),
  email: z.string().email(),
  doc_id: z.string().min(1), // raw ID number/passport — hashed below, never stored plaintext
});

// Stub KYC intake: hash the doc id, store status=pending. Wire to a real KYC provider before mainnet.
router.post("/", (req, res) => {
  const parsed = kycSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { wallet_address, full_name, email, doc_id } = parsed.data;
  const doc_id_hash = createHash("sha256").update(doc_id).digest("hex");

  db.prepare(
    `INSERT INTO kyc_submissions (wallet_address, full_name, email, doc_id_hash, status)
     VALUES (?, ?, ?, ?, 'pending')
     ON CONFLICT(wallet_address) DO UPDATE SET full_name=excluded.full_name, email=excluded.email, doc_id_hash=excluded.doc_id_hash, status='pending'`
  ).run(wallet_address, full_name, email, doc_id_hash);

  res.status(201).json({ ok: true, status: "pending" });
});

router.get("/:wallet", (req, res) => {
  const row = db.prepare("SELECT wallet_address, status, created_at FROM kyc_submissions WHERE wallet_address = ?").get(req.params.wallet);
  res.json(row ?? { wallet_address: req.params.wallet, status: "none" });
});

// Admin-only in real deployment — gate behind auth before production use
router.patch("/:wallet/review", (req, res) => {
  const { status } = req.body; // 'approved' | 'rejected'
  if (!["approved", "rejected"].includes(status)) return res.status(400).json({ error: "bad status" });

  db.prepare("UPDATE kyc_submissions SET status = ? WHERE wallet_address = ?").run(status, req.params.wallet);
  res.json({ ok: true, status });
});

export default router;
