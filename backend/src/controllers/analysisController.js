const crawlerService = require("../services/crawlerService");
const comparisonService = require("../services/comparisonService");
const aiService = require("../services/aiService");
const { logger } = require("../utils/logger");

/* ---------------------------------------------
   Extract brand name from domain (Option B)
---------------------------------------------- */
function extractBrand(url) {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    const name = hostname.split(".")[0];

    // Capitalize properly
    return name
      .replace(/-/g, " ")
      .replace(/\d+/g, "²") // turn 2 → ² (Position²)
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return url;
  }
}

class AnalysisController {
  async analyzeWebsites(req, res) {
    try {
      const { clientUrl, competitorUrl } = req.body;

      if (!clientUrl || !competitorUrl) {
        return res.status(400).json({
          success: false,
          error: "clientUrl and competitorUrl are required.",
        });
      }

      logger.info("==================================================");
      logger.info("New Analysis Started");
      logger.info(`Client: ${clientUrl}`);
      logger.info(`Competitor: ${competitorUrl}`);
      logger.info("==================================================");

      // Convert URLs → Brand names
      const clientName = extractBrand(clientUrl);
      const competitorName = extractBrand(competitorUrl);

      // STEP 1 — Crawl
      logger.info("Step 1: Crawling websites…");

      const [clientData, competitorData] = await Promise.all([
        crawlerService.crawlWebsite(clientUrl),
        crawlerService.crawlWebsite(competitorUrl),
      ]);

      if (clientData.error || competitorData.error) {
        return res.status(500).json({
          success: false,
          error: "One or both websites failed to crawl.",
          clientError: clientData.error ? clientData.message : null,
          competitorError: competitorData.error ? competitorData.message : null,
        });
      }

      // STEP 2 — Compare Raw Data
      logger.info("Step 2: Comparing websites…");
      const comparison = comparisonService.compareWebsites(clientData, competitorData);

      // Compress comparison for AI prompt
      const compressedComparison = this.compressComparison(comparison);

      // STEP 3 — AI Interpretations
      logger.info("Step 3: Running AI analysis…");
      const aiAnalysis = await aiService.analyzeComparison(
        clientData,
        competitorData,
        compressedComparison
      );

      /* -----------------------------------------
         STEP 4 — Attach True Winner Names (brand)
      ------------------------------------------ */

      aiAnalysis.seoComparison.winner =
        aiAnalysis.seoComparison.winner === "client"
          ? clientName
          : aiAnalysis.seoComparison.winner === "competitor"
          ? competitorName
          : "Tie";

      aiAnalysis.contentComparison.winner =
        aiAnalysis.contentComparison.winner === "client"
          ? clientName
          : aiAnalysis.contentComparison.winner === "competitor"
          ? competitorName
          : "Tie";

      aiAnalysis.uiuxComparison.winner =
        aiAnalysis.uiuxComparison.winner === "client"
          ? clientName
          : aiAnalysis.uiuxComparison.winner === "competitor"
          ? competitorName
          : "Tie";

      aiAnalysis.performanceComparison.winner =
        aiAnalysis.performanceComparison.winner === "client"
          ? clientName
          : aiAnalysis.performanceComparison.winner === "competitor"
          ? competitorName
          : "Tie";

      /* -----------------------------------------
         Compute Overall Winner (brand name)
      ------------------------------------------ */

      const overall = this.determineOverallWinner(aiAnalysis);

      const finalWinner =
        overall === "client"
          ? clientName
          : overall === "competitor"
          ? competitorName
          : "Tie";

      logger.info("Step 4: Building final report…");

      const report = {
        timestamp: new Date().toISOString(),
        urls: { client: clientUrl, competitor: competitorUrl },
        brandNames: { client: clientName, competitor: competitorName },

        crawlData: {
          client: this.sanitizeCrawlData(clientData),
          competitor: this.sanitizeCrawlData(competitorData),
        },

        comparison,
        compressedComparison,
        analysis: aiAnalysis,

        summary: {
          overallWinner: finalWinner,
          quickStats: {
            client: {
              wordCount: clientData.wordCount,
              loadTime: clientData.performance?.loadTime,
              images: clientData.images.length,
              schema: clientData.schema.length,
            },
            competitor: {
              wordCount: competitorData.wordCount,
              loadTime: competitorData.performance?.loadTime,
              images: competitorData.images.length,
              schema: competitorData.schema.length,
            },
          },
        },
      };

      return res.json({ success: true, data: report });
    } catch (err) {
      logger.error("Analysis failed:", err);

      return res.status(500).json({
        success: false,
        error: {
          message: err.message,
          stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        },
      });
    }
  }

  // ------------------------------------------
  // Compress comparison sent to AI
  // ------------------------------------------
  compressComparison(c) {
    return {
      seo: {
        title: c.seo.title,
        metaDescription: c.seo.metaDescription,
        images: c.seo.images,
        structuredData: c.seo.structuredData,
        openGraph: c.seo.openGraph,
      },
      content: c.content,
      uiux: {
        navigation: c.uiux.navigation,
        responsive: c.uiux.responsive,
      },
      performance: c.performance,
    };
  }

  sanitizeCrawlData(data) {
    return {
      url: data.url,
      title: data.title,
      metaDescription: data.metaDescription,
      h1: data.h1,
      h2: data.h2.slice(0, 10),
      h3: data.h3.slice(0, 10),

      wordCount: data.wordCount,
      imageCount: data.images.length,
      imagesWithAlt: data.images.filter((x) => x.alt).length,

      internalLinks: data.internalLinks.length,
      externalLinks: data.externalLinks.length,

      buttons: data.buttons.slice(0, 5),
      navigationLinks: data.navigationLinks.slice(0, 10),

      schemaTypes: data.schema.map((s) => s["@type"] || "Unknown"),
      structuredDataCount: data.schema.length,

      performance: data.performance,
      canonical: !!data.canonical,
      language: data.language,
      responsive: data.hasMediaQueries,
      twitterCard: data.twitterCard,
    };
  }

  // Returns: "client", "competitor", or "tie"
  determineOverallWinner(analysis) {
    const wins = [
      analysis.seoComparison?.winner,
      analysis.contentComparison?.winner,
      analysis.uiuxComparison?.winner,
      analysis.performanceComparison?.winner,
    ];

    const clientWins = wins.filter((x) => x === "client").length;
    const competitorWins = wins.filter((x) => x === "competitor").length;

    if (clientWins > competitorWins) return "client";
    if (competitorWins > clientWins) return "competitor";
    return "tie";
  }
}

module.exports = new AnalysisController();
