import { chromium } from "playwright";

const BASE = "https://sanand0.github.io/tdsdata/js_table/?seed=";
const SEEDS = [43, 44, 45, 46, 47, 48, 49, 50, 51, 52];

function extractNums(text) {
  // ONLY positive integers (prevents accidental -50 etc.)
  const matches = text.match(/\b\d+\b/g) || [];
  return matches.map((m) => BigInt(m));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let grandTotal = 0n;

  for (const seed of SEEDS) {
    const url = `${BASE}${seed}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // This page is basically plain text numbers, so read body text
    const bodyText = await page.evaluate(() => document.body.innerText);

    const nums = extractNums(bodyText);
    const pageSum = nums.reduce((a, b) => a + b, 0n);

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
