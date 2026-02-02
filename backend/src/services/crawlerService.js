const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");
const cheerio = require("cheerio");
const { logger } = require("../utils/logger");

class CrawlerService {
  async crawlWebsite(url) {
    let browser;

    try {
      logger.info(`Crawling started: ${url}`);

      /* ----------------------------------------------------
          FIX 1: Reliable Chromium launch for Render
      ---------------------------------------------------- */
      const executablePath = await chromium.executablePath;

      browser = await puppeteer.launch({
        executablePath,
        args: [
          ...chromium.args,
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--single-process",
          "--no-zygote"
        ],
        defaultViewport: chromium.defaultViewport,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });

      /* ----------------------------------------------------
          FIX 2: Open page safely
      ---------------------------------------------------- */
      const page = await browser.newPage();

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 CompetitorAnalyzerBot"
      );

      await page.setDefaultNavigationTimeout(60000);

      await page.goto(url, {
        waitUntil: ["load", "domcontentloaded"],
        timeout: 60000,
      });

      await page.waitForTimeout(1500);

      /* ----------------------------------------------------
          FIX 3: Extract HTML safely
      ---------------------------------------------------- */
      const html = await page.content();
      const $ = cheerio.load(html);

      const text = $("body").text().replace(/\s+/g, " ").trim();

      const data = {
        url,
        title: $("title").text().trim() || "",
        metaDescription: $('meta[name="description"]').attr("content") || "",
        h1: $("h1")
          .map((_, el) => $(el).text().trim())
          .get(),
        h2: $("h2")
          .map((_, el) => $(el).text().trim())
          .get(),
        h3: $("h3")
          .map((_, el) => $(el).text().trim())
          .get(),
        images: $("img")
          .map((_, el) => ({
            src: $(el).attr("src"),
            alt: $(el).attr("alt") || "",
          }))
          .get(),
        wordCount: text.split(" ").filter(Boolean).length,
        textContent: text,
      };

      await browser.close();

      logger.info(`Crawl success: ${url}`);
      return data;

    } catch (e) {
      logger.error(`Crawl failed for ${url}: ${e.message}`);

      try {
        if (browser) await browser.close();
      } catch (_) {}

      return {
        error: true,
        message: e.message,
        url,
      };
    }
  }
}

module.exports = new CrawlerService();
