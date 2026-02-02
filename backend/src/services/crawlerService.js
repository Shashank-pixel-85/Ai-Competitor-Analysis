const { chromium } = require("playwright");
const cheerio = require("cheerio");
const { logger } = require("../utils/logger");

class CrawlerService {
  async crawlWebsite(url) {
    let browser;

    try {
      logger.info(`Crawling started: ${url}`);

      browser = await chromium.launch({ headless: true });

      const context = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 CompetitorAnalyzerBot",
        viewport: { width: 1366, height: 1080 }
      });

      const page = await context.newPage();

      /* -------------------------------
         FIX #1 — More reliable loading
      -------------------------------- */
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,          // increased timeout
      });

      // Extra wait for dynamic React/Next sites
      await page.waitForTimeout(2500);

      // Try to reach network idle, but ignore timeout
      try {
        await page.waitForLoadState("networkidle", { timeout: 6000 });
      } catch {
        logger.info("Network idle not reached — continuing...");
      }

      /* -------------------------------
         FIX #2 — Performance metrics
      -------------------------------- */
      const perf = await page.evaluate(() => {
        const t = performance.timing;
        return {
          loadTime:
            t.loadEventEnd && t.navigationStart
              ? t.loadEventEnd - t.navigationStart
              : 0,

          domContentLoaded:
            t.domContentLoadedEventEnd && t.navigationStart
              ? t.domContentLoadedEventEnd - t.navigationStart
              : 0,

          firstPaint:
            performance.getEntriesByType("paint")[0]?.startTime || 0,
        };
      });

      /* -------------------------------
         Extract full HTML after waits
      -------------------------------- */
      const html = await page.content();
      const $ = cheerio.load(html);

      const data = {
        url,
        title: $("title").text().trim() || "",
        metaDescription: $('meta[name="description"]').attr("content") || "",
        metaKeywords: $('meta[name="keywords"]').attr("content") || "",
        canonical: $('link[rel="canonical"]').attr("href") || "",

        ogTitle: $('meta[property="og:title"]').attr("content") || "",
        ogDescription: $('meta[property="og:description"]').attr("content") || "",
        ogImage: $('meta[property="og:image"]').attr("content") || "",

        h1: [],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: [],

        internalLinks: [],
        externalLinks: [],
        images: [],
        buttons: [],

        schema: [],
        structuredDataCount: 0,

        navigationLinks: [],
        hasRobotsMeta: $("meta[name='robots']").length > 0,
        robotsContent: $("meta[name='robots']").attr("content") || "",
        charset: $("meta[charset]").attr("charset") || "",
        language: $("html").attr("lang") || "",

        performance: perf,

        hasMediaQueries: html.includes("@media"),
        twitterCard: $('meta[name="twitter:card"]').attr("content") || "",

        textContent: "",
        wordCount: 0
      };

      /* -------------------------------
         HEADINGS
      -------------------------------- */
      ["h1", "h2", "h3", "h4", "h5", "h6"].forEach((tag) => {
        data[tag] = $(tag)
          .map((i, el) => $(el).text().trim())
          .get()
          .filter(Boolean);
      });

      /* -------------------------------
         LINKS (internal / external)
      -------------------------------- */
      const base = new URL(url);

      $("a[href]").each((_, el) => {
        let href = $(el).attr("href");
        if (!href || href.startsWith("javascript:")) return;

        try {
          let resolved = new URL(href, base);
          const linkObj = { url: resolved.href, text: $(el).text().trim() };

          if (resolved.hostname === base.hostname)
            data.internalLinks.push(linkObj);
          else data.externalLinks.push(linkObj);
        } catch {}
      });

      /* -------------------------------
         NAVIGATION LINKS
      -------------------------------- */
      $("nav a, header a, [role='navigation'] a").each((_, el) => {
        let text = $(el).text().trim();
        let href = $(el).attr("href");
        if (text && href) data.navigationLinks.push({ text, url: href });
      });

      /* -------------------------------
         IMAGES
      -------------------------------- */
      $("img").each((_, el) => {
        const src = $(el).attr("src");
        if (!src) return;

        data.images.push({
          src,
          alt: $(el).attr("alt") || "",
          title: $(el).attr("title") || "",
        });
      });

      /* -------------------------------
         BUTTONS
      -------------------------------- */
      $("button, a.btn, a.button, [role='button'], input[type='submit']").each(
        (_, el) => {
          const text = $(el).text().trim() || $(el).attr("value") || "";
          const href = $(el).attr("href") || "";
          if (text) data.buttons.push({ text, href });
        }
      );

      /* -------------------------------
         SCHEMA / STRUCTURED DATA
      -------------------------------- */
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const parsed = JSON.parse($(el).html());
          data.schema.push(parsed);
          data.structuredDataCount++;
        } catch {
          logger.warn("Invalid schema block skipped");
        }
      });

      /* -------------------------------
         TEXT CONTENT + WORD COUNT
      -------------------------------- */
      const text = $("body").text().replace(/\s+/g, " ").trim();
      data.textContent = text;
      data.wordCount = text.split(" ").filter(Boolean).length;

      await browser.close();

      logger.info(`Crawl success: ${url}`);
      return data;

    } catch (e) {
      if (browser) await browser.close();
      logger.error(`Crawl failed for ${url}: ${e.message}`);
      return { error: true, message: e.message, url };
    }
  }
}

module.exports = new CrawlerService();
