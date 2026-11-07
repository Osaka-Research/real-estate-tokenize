// Loads scraper/output/*-latest.json (written by ../../scraper/zillow.js) into the
// properties table as pending, untokenized listings (chain_property_id stays null —
// nothing here has gone through issueProperty() yet). Share economics are a flat
// placeholder ($10/share, 1 USD ~ 1 TRX) since these are scraped listings, not
// appraised/custodied properties; real numbers get set when a listing is actually
// issued on-chain. Re-running is safe: source_url is unique, re-imports are ignored.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import db from "./db/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRAPER_OUTPUT_DIR = path.join(__dirname, "..", "..", "scraper", "output");
const PLACEHOLDER_CUSTODIAN = "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7";
const USD_PER_SHARE = 10;

const insert = db.prepare(`
  INSERT OR IGNORE INTO properties
    (title, address, description, valuation_usd, total_shares, price_per_share_sun, custodian_address, images, docs, status, source_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]', 'pending', ?)
`);

function importFile(file) {
  const listings = JSON.parse(fs.readFileSync(file, "utf8"));
  let inserted = 0;
  for (const l of listings) {
    if (!l.address || !l.valuation_usd || l.valuation_usd <= 0) continue;
    const totalShares = Math.max(1, Math.round(l.valuation_usd / USD_PER_SHARE));
    const pricePerShareSun = USD_PER_SHARE * 1_000_000; // 1 USD ~ 1 TRX placeholder, TRX has 6 decimals (sun)
    const result = insert.run(
      l.title || l.address,
      l.address,
      l.description || "",
      l.valuation_usd,
      totalShares,
      pricePerShareSun,
      PLACEHOLDER_CUSTODIAN,
      JSON.stringify(l.image ? [l.image] : []),
      l.source_url || null
    );
    if (result.changes > 0) inserted++;
  }
  return { total: listings.length, inserted };
}

function main() {
  if (!fs.existsSync(SCRAPER_OUTPUT_DIR)) {
    console.log(`No scraper output dir at ${SCRAPER_OUTPUT_DIR}`);
    return;
  }
  const files = fs.readdirSync(SCRAPER_OUTPUT_DIR).filter((f) => f.endsWith("-latest.json"));
  if (files.length === 0) {
    console.log("No *-latest.json files to import yet.");
    return;
  }
  let totalInserted = 0;
  for (const file of files) {
    const { total, inserted } = importFile(path.join(SCRAPER_OUTPUT_DIR, file));
    console.log(`${file}: ${inserted}/${total} new`);
    totalInserted += inserted;
  }
  console.log(`Imported ${totalInserted} new listings.`);
}

main();
