// ===============================
// FIXED & UPGRADED COMPARISON SERVICE
// Real scoring + real winners
// ===============================

const { logger } = require("../utils/logger");

class ComparisonService {
  compareWebsites(client, competitor) {
    logger.info("Running website comparison…");

    if (client.error || competitor.error) {
      return { error: "One or both websites failed to crawl." };
    }

    // RAW DETAIL COMPARISON
    const seo = this.compareSEO(client, competitor);
    const content = this.compareContent(client, competitor);
    const uiux = this.compareUIUX(client, competitor);
    const performance = this.comparePerformance(client, competitor);

    // COMPUTE SCORES FOR EACH CATEGORY
    const seoScore = this.computeSEOScore(seo);
    const contentScore = this.computeContentScore(content);
    const uiuxScore = this.computeUIUXScore(uiux);
    const perfScore = this.computePerformanceScore(performance);

    // WINNERS FOR EACH CATEGORY
    const winners = {
      seo: this.getWinner(seoScore.client, seoScore.competitor),
      content: this.getWinner(contentScore.client, contentScore.competitor),
      uiux: this.getWinner(uiuxScore.client, uiuxScore.competitor),
      performance: this.getWinner(perfScore.client, perfScore.competitor)
    };

    return {
      seo,
      content,
      uiux,
      performance,

      // NEW – SCORE OBJECTS
      seoScore,
      contentScore,
      uiuxScore,
      performanceScore: perfScore,

      winners
    };
  }

  // ---------------------------
  // WINNER HELPER
  // ---------------------------
  getWinner(a, b) {
    if (a > b) return "client";
    if (b > a) return "competitor";
    return "tie";
  }

  // ---------------------------
  // SEO COMPARISON
  // ---------------------------
  compareSEO(c, d) {
    return {
      title: this.compareTitle(c, d),
      metaDescription: this.compareMeta(c, d),
      headings: this.compareHeadings(c, d),
      images: this.compareImages(c, d),
      structuredData: this.compareSchema(c, d),
      openGraph: this.compareOG(c, d)
    };
  }

  computeSEOScore(seo) {
    return {
      client:
        (seo.title.client.optimal ? 20 : 10) +
        (seo.metaDescription.client.optimal ? 20 : 10) +
        (parseFloat(seo.images.client.altOptimization) / 100) * 20 +
        Math.min(seo.structuredData.client.count * 5, 20) +
        (seo.openGraph.client.title ? 5 : 0) +
        (seo.openGraph.client.description ? 5 : 0),

      competitor:
        (seo.title.competitor.optimal ? 20 : 10) +
        (seo.metaDescription.competitor.optimal ? 20 : 10) +
        (parseFloat(seo.images.competitor.altOptimization) / 100) * 20 +
        Math.min(seo.structuredData.competitor.count * 5, 20) +
        (seo.openGraph.competitor.title ? 5 : 0) +
        (seo.openGraph.competitor.description ? 5 : 0)
    };
  }

  compareTitle(c, d) {
    return {
      client: {
        value: c.title,
        length: c.title.length,
        optimal: c.title.length >= 30 && c.title.length <= 60
      },
      competitor: {
        value: d.title,
        length: d.title.length,
        optimal: d.title.length >= 30 && d.title.length <= 60
      }
    };
  }

  compareMeta(c, d) {
    return {
      client: {
        value: c.metaDescription,
        length: c.metaDescription.length,
        optimal:
          c.metaDescription.length >= 120 &&
          c.metaDescription.length <= 160
      },
      competitor: {
        value: d.metaDescription,
        length: d.metaDescription.length,
        optimal:
          d.metaDescription.length >= 120 &&
          d.metaDescription.length <= 160
      }
    };
  }

  compareHeadings(c, d) {
    return {
      client: {
        h1: c.h1.length,
        h2: c.h2.length,
        h3: c.h3.length,
        hasH1: c.h1.length > 0
      },
      competitor: {
        h1: d.h1.length,
        h2: d.h2.length,
        h3: d.h3.length,
        hasH1: d.h1.length > 0
      }
    };
  }

  compareImages(c, d) {
    const altPct = (arr) =>
      arr.length
        ? ((arr.filter((x) => x.alt).length / arr.length) * 100).toFixed(1)
        : 0;

    return {
      client: {
        total: c.images.length,
        altOptimization: altPct(c.images)
      },
      competitor: {
        total: d.images.length,
        altOptimization: altPct(d.images)
      }
    };
  }

  compareSchema(c, d) {
    const getTypes = (arr) =>
      arr.map((s) => s["@type"] || "Unknown").slice(0, 5);

    return {
      client: {
        count: c.structuredDataCount,
        types: getTypes(c.schema)
      },
      competitor: {
        count: d.structuredDataCount,
        types: getTypes(d.schema)
      }
    };
  }

  compareOG(c, d) {
    return {
      client: {
        title: !!c.ogTitle,
        description: !!c.ogDescription,
        image: !!c.ogImage
      },
      competitor: {
        title: !!d.ogTitle,
        description: !!d.ogDescription,
        image: !!d.ogImage
      }
    };
  }

  // ---------------------------
  // CONTENT
  // ---------------------------
  compareContent(c, d) {
    return {
      wordCount: {
        client: c.wordCount,
        competitor: d.wordCount
      },
      internalLinks: {
        client: c.internalLinks.length,
        competitor: d.internalLinks.length
      },
      externalLinks: {
        client: c.externalLinks.length,
        competitor: d.externalLinks.length
      },
      buttons: {
        client: c.buttons.length,
        competitor: d.buttons.length
      }
    };
  }

  computeContentScore(data) {
    return {
      client:
        Math.min(data.wordCount.client / 25, 25) +
        Math.min(data.internalLinks.client * 2, 20) +
        Math.min(data.externalLinks.client * 2, 20) +
        Math.min(data.buttons.client * 5, 25),

      competitor:
        Math.min(data.wordCount.competitor / 25, 25) +
        Math.min(data.internalLinks.competitor * 2, 20) +
        Math.min(data.externalLinks.competitor * 2, 20) +
        Math.min(data.buttons.competitor * 5, 25)
    };
  }

  // ---------------------------
  // UI/UX
  // ---------------------------
  compareUIUX(c, d) {
    return {
      navigation: {
        client: c.navigationLinks.length,
        competitor: d.navigationLinks.length
      },
      ctaQuality: {
        client: c.buttons.slice(0, 5).map((b) => b.text),
        competitor: d.buttons.slice(0, 5).map((b) => b.text)
      },
      responsive: {
        client: c.hasMediaQueries,
        competitor: d.hasMediaQueries
      }
    };
  }

  computeUIUXScore(uiux) {
    return {
      client:
        Math.min(uiux.navigation.client * 4, 40) +
        (uiux.responsive.client ? 35 : 10) +
        Math.min(uiux.ctaQuality.client.length * 5, 25),

      competitor:
        Math.min(uiux.navigation.competitor * 4, 40) +
        (uiux.responsive.competitor ? 35 : 10) +
        Math.min(uiux.ctaQuality.competitor.length * 5, 25)
    };
  }

  // ---------------------------
  // PERFORMANCE
  // ---------------------------
  comparePerformance(c, d) {
    const winner = (a, b) => (a < b ? "client" : "competitor");

    return {
      loadTime: {
        client: c.performance.loadTime,
        competitor: d.performance.loadTime,
        winner: winner(c.performance.loadTime, d.performance.loadTime)
      },
      domContentLoaded: {
        client: c.performance.domContentLoaded,
        competitor: d.performance.domContentLoaded,
        winner: winner(
          c.performance.domContentLoaded,
          d.performance.domContentLoaded
        )
      },
      firstPaint: {
        client: c.performance.firstPaint,
        competitor: d.performance.firstPaint,
        winner: winner(
          c.performance.firstPaint,
          d.performance.firstPaint
        )
      }
    };
  }

  computePerformanceScore(perf) {
    const perfFactor = (v) => Math.max(0, 100 - v / 30);

    return {
      client:
        perfFactor(perf.loadTime.client) * 0.4 +
        perfFactor(perf.domContentLoaded.client) * 0.3 +
        perfFactor(perf.firstPaint.client) * 0.3,

      competitor:
        perfFactor(perf.loadTime.competitor) * 0.4 +
        perfFactor(perf.domContentLoaded.competitor) * 0.3 +
        perfFactor(perf.firstPaint.competitor) * 0.3
    };
  }
}

module.exports = new ComparisonService();
