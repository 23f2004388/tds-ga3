import { chromium } from "playwright";

const HUB =
  "https://exam.sanand.workers.dev/tds-2026-01-ga3/#hq-scheduled-github-actions";

const SEEDS = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

function extractInts(text) {
  const matches = text.match(/-?\d[\d,]*/g) || [];
  return matches.map((m) => BigInt(m.replace(/,/g, "")));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1) Open hub page (WITH hash)
  await page.goto(HUB, { waitUntil: "networkidle" });

  let grandTotal = 0n;

  for (const seed of SEEDS) {
    // 2) Find the Seed link in DOM (don’t require visibility)
    const link = page.locator("a", { hasText: `Seed ${seed}` }).first();
    await link.waitFor({ state: "attached", timeout: 60000 });

    const href = await link.getAttribute("href");
    if (!href) throw new Error(`Seed ${seed} link has no href`);

    const seedUrl = new URL(href, HUB).toString();

    // 3) Open seed page
    await page.goto(seedUrl, { waitUntil: "networkidle" });

    // 4) Wait for tables to exist (attached, not visible)
    await page.locator("table").first().waitFor({ state: "attached", timeout: 60000 });

    // 5) Sum numbers from all table cells (td + th)
    const cellText = await page.$$eval("table td, table th", (cells) =>
      cells.map((c) => c.textContent || "").join(" ")
    );

    const nums = extractInts(cellText);
    const pageSum = nums.reduce((acc, v) => acc + v, 0n);

    console.log(`Seed ${seed} => ${pageSum.toString()}`);
    grandTotal += pageSum;

    // go back to hub for next seed
    await page.goto(HUB, { waitUntil: "networkidle" });
  }

  console.log("TOTAL_SUM", grandTotal.toString());
  await browser.close();
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
