// Scrapes Zillow for-sale listings for a given location into our property schema.
// Runs real (non-headless) Chromium through Xvfb — no stealth plugins, no proxy
// rotation, no CAPTCHA bypass. If Zillow's bot wall blocks it, this reports that
// plainly instead of trying to defeat it. Respect their ToS — low volume, personal use.
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || "/data/data/com.termux/files/usr/bin/chromium-browser";
const DISPLAY = process.env.DISPLAY || ":99";

const location = process.argv[2] || "austin-tx";
const url = `https://www.zillow.com/${location}/`;

function money(str) {
  if (!str) return null;
  const n = Number(String(str).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    headless: false,
    env: { ...process.env, DISPLAY },
    args: ["--no-sandbox", "--disable-gpu", "--window-size=1366,900"],
    defaultViewport: { width: 1366, height: 900 },
  });

  const page = await browser.newPage();

  console.log(`Navigating to ${url}`);
  const response = await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 }).catch((e) => {
    console.error(`Navigation failed: ${e.message}`);
    return null;
  });

  const title = await page.title().catch(() => "");
  const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 2000) || "").catch(() => "");

  const blocked =
    /press\s*&?\s*hold|verify you.?re a human|let.?s confirm you.?re a human|captcha/i.test(title + bodyText) ||
    (response && [403, 429].includes(response.status()));

  fs.mkdirSync(path.join(__dirname, "output"), { recursive: true });
  const slug = location.replace(/[^a-z0-9-]/gi, "_");

  if (blocked) {
    await page.screenshot({ path: path.join(__dirname, "output", `${slug}-blocked.png`) }).catch(() => {});
    console.error("BLOCKED: Zillow's bot wall caught this request (status/page text indicates a human-verification challenge).");
    console.error(`Page title: "${title}"`);
    console.error(`Saved screenshot: output/${slug}-blocked.png`);
    console.error("Not attempting to solve the challenge or rotate identity — that's the stopping point for this approach.");
    await browser.close();
    process.exit(1);
  }

  // Strategy 1: pull the embedded Next.js data blob Zillow server-renders for SEO/crawlers.
  const nextData = await page
    .evaluate(() => {
      const el = document.querySelector("script#__NEXT_DATA__");
      return el ? el.textContent : null;
    })
    .catch(() => null);

  let listings = [];

  if (nextData) {
    try {
      const parsed = JSON.parse(nextData);
      const searchResults =
        parsed?.props?.pageProps?.searchPageState?.cat1?.searchResults?.listResults ||
        parsed?.props?.pageProps?.searchPageState?.cat1?.searchResults?.mapResults ||
        [];
      listings = searchResults.map(normalizeFromState);
    } catch (e) {
      console.error(`Failed parsing __NEXT_DATA__: ${e.message}`);
    }
  }

  // Strategy 2: fall back to DOM scraping visible listing cards.
  if (listings.length === 0) {
    listings = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-test="property-card"], article[data-test="property-card"]'));
      return cards.map((card) => {
        const addr = card.querySelector('[data-test="property-card-addr"]')?.textContent?.trim() || card.querySelector("address")?.textContent?.trim();
        const price = card.querySelector('[data-test="property-card-price"]')?.textContent?.trim();
        const link = card.querySelector("a")?.href;
        const img = card.querySelector("img")?.src;
        const detail = card.querySelector('[data-test="property-card-details"]')?.textContent?.trim();
        return { address: addr, price, link, img, detail };
      });
    });
    listings = listings.map(normalizeFromDom).filter((l) => l.address);
  }

  console.log(`Extracted ${listings.length} listings from ${location}.`);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const latestFile = path.join(__dirname, "output", `${slug}-latest.json`);
  const historyFile = path.join(__dirname, "output", `${slug}-${timestamp}.json`);
  fs.writeFileSync(latestFile, JSON.stringify(listings, null, 2));
  fs.writeFileSync(historyFile, JSON.stringify(listings, null, 2));
  console.log(`Wrote ${latestFile}`);

  await browser.close();
}

function normalizeFromState(r) {
  return {
    source: "zillow",
    source_id: r.zpid ? String(r.zpid) : null,
    source_url: r.detailUrl ? (r.detailUrl.startsWith("http") ? r.detailUrl : `https://www.zillow.com${r.detailUrl}`) : null,
    title: r.address || r.statusText || "Untitled property",
    address: r.address || "",
    description: r.statusText || "",
    valuation_usd: r.unformattedPrice || money(r.price),
    beds: r.beds ?? null,
    baths: r.baths ?? null,
    living_area_sqft: r.livingArea ?? null,
    image: r.imgSrc || null,
  };
}

function normalizeFromDom(r) {
  return {
    source: "zillow",
    source_id: null,
    source_url: r.link || null,
    title: r.address || "Untitled property",
    address: r.address || "",
    description: r.detail || "",
    valuation_usd: money(r.price),
    beds: null,
    baths: null,
    living_area_sqft: null,
    image: r.img || null,
  };
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
