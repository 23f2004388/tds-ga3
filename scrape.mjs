import { chromium } from "playwright";

const BASE = "https://sanand0.github.io/tdsdata/js_table/?seed=";
const SEEDS = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

function extractInts(text) {
  const matches = text.match(/-?\d+/g) || [];
  return matches.map((m) => BigInt(m));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let grandTotal = 0n;

  for (const seed of SEEDS) {
    const url = `${BASE}${seed}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // take all text from the page (your screenshot shows numbers in plain text)
    const bodyText = await page.evaluate(() => document.body.innerText);

    const nums = extractInts(bodyText);

    // If page has a title like "Table", it won't affect because it has no digits.
    const pageSum = nums.reduce((acc, v) => acc + v, 0n);

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
