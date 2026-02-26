import { chromium } from "playwright";

const START_URL =
  "https://exam.sanand.workers.dev/tds-2026-01-ga3/";

function extractInts(text) {
  const matches = text.match(/-?\d[\d,]*/g) || [];
  return matches.map((m) => BigInt(m.replace(/,/g, "")));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(START_URL, { waitUntil: "networkidle" });

  // Wait until seed links appear
  await page.waitForSelector("a");

  const seedLinks = await page.$$eval("a", (as) =>
    as
      .map((a) => ({ text: (a.textContent || "").trim(), href: a.href }))
      .filter((x) => /^Seed\s+\d+/i.test(x.text))
  );

  let grandTotal = 0n;

  for (const { text, href } of seedLinks) {
    await page.goto(href, { waitUntil: "networkidle" });

    // Wait until tables load
    await page.waitForSelector("table");

    const tableText = await page.$$eval("table", (tables) =>
      tables.map((t) => t.innerText).join("\n")
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
