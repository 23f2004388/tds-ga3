import { chromium } from "playwright";

const HUB_URL = "https://exam.sanand.workers.dev/tds-2026-01-ga3/";

function extractInts(text) {
  const matches = text.match(/-?\d[\d,]*/g) || [];
  return matches.map((m) => BigInt(m.replace(/,/g, "")));
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Load hub page
  await page.goto(HUB_URL, { waitUntil: "domcontentloaded" });

  // Wait until any "Seed " text appears somewhere on the page (not necessarily visible)
  await page.waitForFunction(() => document.body && document.body.innerText.includes("Seed "), null, {
    timeout: 60000,
  });

  // Collect links whose text contains "Seed"
  const seedLinks = await page.$$eval("a", (as) =>
    as
      .map((a) => ({ text: (a.textContent || "").trim(), href: a.href }))
      .filter((x) => /^Seed\s+\d+/i.test(x.text) && x.href)
  );

  if (seedLinks.length === 0) {
    // Debug print a small part of page text to logs
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
    console.log("DEBUG: No seed links found. Body starts with:\n", bodyText);
    throw new Error("No Seed links found.");
  }

  let grandTotal = 0n;

  for (const { text, href } of seedLinks) {
    await page.goto(href, { waitUntil: "domcontentloaded" });

    // Wait for tables OR just wait a bit (some pages might be slow)
    await page.waitForTimeout(1200);

    const tableText = await page.$$eval("table", (tables) =>
      tables.length ? tables.map((t) => t.innerText).join("\n") : ""
    );

    const nums = extractInts(tableText);
    const pageSum = nums.reduce((acc, v) => acc + v, 0n);

    console.log(`${text} => ${pageSum.toString()}`);
    grandTotal += pageSum;
  }

  console.log("TOTAL_SUM", grandTotal.toString());
  await browser.close();
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
