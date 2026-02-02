const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const { logger } = require("../utils/logger");

class CrawlerService {
  async crawlWebsite(url) {
    let browser;

    try {
      logger.info(`Crawling started: ${url}`);

      browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
        ],
      });

      const page = await browser.newPage();

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 CompetitorAnalyzerBot"
      );

      await page.setViewport({ width: 1366, height: 1080 });

      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      await page.waitForTimeout(2500);

      try {
        await page.waitForNetworkIdle({ timeout: 6000 });
      } catch {
        logger.info("Network idle not reached — continuing...");
      }

      const perf = await page.evaluate(() => {
        const t = performance.timing;
        return {
          loadTime: t.loadEventEnd && t.navigationStart ? t.loadEventEnd - t.navigationStart : 0,
          domContentLoaded: t.domContentLoadedEventEnd && t.navigationStart
            ? t.domContentLoadedEventEnd - t.navigationStart
            : 0,
          firstPaint: performance.getEntriesByType("paint")[0]?.startTime || 0,
        };
      });

      const html = await page.content();
      const $ = cheerio.load(html);

      const data = {
        url,
        title: $("title").text().trim() || "",
        metaDescription: $('meta[name="description"]').attr("content") || "",
        h1: [],
        h2: [],
        h3: [],
        internalLinks: [],
        externalLinks: [],
        images: [],
        buttons: [],
        navigationLinks: [],
        schema: [],
        performance: perf,
        textContent: "",
        wordCount: 0
      };

      ["h1", "h2", "h3"].forEach((tag) => {
        data[tag] = $(tag)
          .map((i, el) => $(el).text().trim())
          .get()
          .filter(Boolean);
      });

      const base = new URL(url);

      $("a[href]").each((_, el) => {
        let href = $(el).attr("href");
        if (!href || href.startsWith("javascript:")) return;

        try {
          let resolved = new URL(href, base);
          const linkObj = { url: resolved.href, text: $(el).text().trim() };

          if (resolved.hostname === base.hostname)
            data.internalLinks.push(linkObj);
          else
            data.externalLinks.push(linkObj);
        } catch {}
      });

      $("nav a, header a, [role='navigation'] a").each((_, el) => {
        let text = $(el).text().trim();
        let href = $(el).attr("href");
        if (text && href) data.navigationLinks.push({ text, url: href });
      });

      $("img").each((_, el) => {
        const src = $(el).attr("src");
        if (!src) return;

        data.images.push({
          src,
          alt: $(el).attr("alt") || "",
        });
      });

      $("button, a.btn, a.button").each((_, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr("href") || "";
        if (text) data.buttons.push({ text, href });
      });

      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const parsed = JSON.parse($(el).html());
          data.schema.push(parsed);
        } catch {}
      });

      const text = $("body").text().replace(/\s+/g, " ").trim();
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
