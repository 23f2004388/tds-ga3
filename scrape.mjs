import { chromium } from "playwright";

const BASE = "https://exam.sanand.workers.dev/tds-2026-01-ga3/";

const SEEDS = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

function extractInts(text) {
  const matches = text.match(/-?\d[\d,]*/g) || [];
  return matches.map((m) => BigInt(m.replace(/,/g, "")));
}

async function sumTablesOnPage(page) {
  // Give the page a moment for any JS table rendering
  await page.waitForTimeout(1200);

  const tableText = await page.$$eval("table", (tables) =>
    tables.length ? tables.map((t) => t.innerText).join("\n") : ""
  );

  const nums = extractInts(tableText);
  return nums.reduce((acc, v) => acc + v, 0n);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let grandTotal = 0n;

  for (const seed of SEEDS) {
    const url = `${BASE}seed/${seed}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const pageSum = await sumTablesOnPage(page);

    console.log(`Seed ${seed} => ${pageSum.toString()}`);
    grandTotal += pageSum;
  }

  console.log("TOTAL_SUM", grandTotal.toString());
  await browser.close();
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
