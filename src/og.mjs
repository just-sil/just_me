// Renders the link-preview cards in assets/og/ from src/og.html.
// Optional: only needed when a lens name, headline or URL changes.
//
//   npx -y http-server -p 8765 -s .   (or: python3 -m http.server 8765)
//   npm i -D playwright && npx playwright install chromium
//   node src/og.mjs [http://127.0.0.1:8765/]

import { lensOrder } from "./data.mjs";

const base = process.argv[2] || "http://127.0.0.1:8765/";
const { chromium } = await import("playwright").catch(() => {
  console.error("Playwright is not installed: npm i -D playwright && npx playwright install chromium");
  process.exit(1);
});

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const lens of lensOrder) {
  await page.goto(`${base}src/og.html?lens=${lens}`);
  await page.waitForSelector("body[data-ready]");
  await page.locator("#card").screenshot({ path: `assets/og/${lens}.png` });
  console.log("  wrote", `assets/og/${lens}.png`);
}
await browser.close();
