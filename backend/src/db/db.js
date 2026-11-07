import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(__dirname, "data.sqlite"));

db.exec(`
  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chain_property_id INTEGER UNIQUE,
    title TEXT NOT NULL,
    address TEXT NOT NULL,
    description TEXT,
    valuation_usd REAL,
    total_shares INTEGER,
    shares_sold INTEGER DEFAULT 0,
    price_per_share_sun INTEGER,
    custodian_address TEXT,
    images TEXT,
    docs TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    investor TEXT,
    amount INTEGER,
    price_per_share_sun INTEGER,
    total_sun INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS kyc_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT,
    doc_id_hash TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

try {
  db.exec("ALTER TABLE properties ADD COLUMN source_url TEXT");
} catch {
  // column already exists from a prior run
}
db.exec("CREATE UNIQUE INDEX IF NOT EXISTS properties_source_url_idx ON properties(source_url) WHERE source_url IS NOT NULL");

export default db;
