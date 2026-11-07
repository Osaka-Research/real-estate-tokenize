import { Router } from "express";
import db from "../db/db.js";
import { addClient, removeClient } from "../feed.js";

const router = Router();

router.get("/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("\n");

  addClient(res);
  req.on("close", () => removeClient(res));
});

// Recent activity backfill (newest first) so a fresh page load isn't an empty feed.
router.get("/recent", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 40, 200);
  const rows = db
    .prepare(
      `SELECT a.*, p.title, p.chain_property_id, p.total_shares
       FROM activity a JOIN properties p ON p.id = a.property_id
       ORDER BY a.id DESC LIMIT ?`
    )
    .all(limit);
  res.json(rows);
});

export default router;
