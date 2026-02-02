const axios = require("axios");
const { logger } = require("../utils/logger");

class AIService {
  constructor() {
    this.client = axios.create({
      baseURL: "https://api.groq.com/openai/v1",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      }
    });
  }

  // Limit string size before sending to Groq
  safeLimit(str, max = 7000) {
    if (!str) return "";
    return str.substring(0, max);
  }

  async analyzeComparison(clientData, competitorData, comparison) {
    logger.info("Starting AI analysis (Groq)…");

    const prompt = this.safeLimit(
      this.buildAnalysisPrompt(clientData, competitorData, comparison),
      7000
    );

    try {
      const response = await this.client.post("/chat/completions", {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are an expert digital marketing consultant. Always respond ONLY with valid JSON. No markdown."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2048
      });

      const raw = response.data.choices[0].message.content;
      return this.parseAnalysis(raw);

    } catch (error) {
      logger.error("Groq AI error:", error.response?.data || error.message);
      throw new Error("AI analysis failed: " + error.message);
    }
  }

  buildAnalysisPrompt(client, competitor, comparison) {
  return `
You are an elite website auditor and digital strategist. 
Your job is to analyze the CLIENT website and COMPETITOR website deeply using the structured metrics provided.

IMPORTANT RULES:
- Respond ONLY with VALID JSON
- No markdown, no explanation
- Provide extremely high-quality, deep, strategic insights
- Write like a senior consultant (McKinsey-level clarity)

====================================
CLIENT WEBSITE SUMMARY
====================================
URL: ${client.url}
Title: ${client.title}
Meta Description: ${client.metaDescription}
Word Count: ${client.wordCount}
Images: ${client.images.length}
Load Time: ${client.performance.loadTime}ms

====================================
COMPETITOR WEBSITE SUMMARY
====================================
URL: ${competitor.url}
Title: ${competitor.title}
Meta Description: ${competitor.metaDescription}
Word Count: ${competitor.wordCount}
Images: ${competitor.images.length}
Load Time: ${competitor.performance.loadTime}ms

====================================
STRUCTURED COMPARISON DATA
====================================
${JSON.stringify(comparison)}

====================================
RETURN JSON IN THIS EXACT FORMAT:
====================================

{
  "executiveSummary": "",
  "seoComparison": {
    "winner": "",
    "keyFindings": [],
    "clientStrengths": [],
    "clientWeaknesses": [],
    "competitorStrengths": [],
    "competitorWeaknesses": []
  },
  "contentComparison": {
    "winner": "",
    "keyFindings": [],
    "clientStrengths": [],
    "clientWeaknesses": [],
    "competitorStrengths": [],
    "competitorWeaknesses": []
  },
  "uiuxComparison": {
    "winner": "",
    "keyFindings": [],
    "clientStrengths": [],
    "clientWeaknesses": [],
    "competitorStrengths": [],
    "competitorWeaknesses": []
  },
  "performanceComparison": {
    "winner": "",
    "keyFindings": []
  },
  "whatCompetitorDoesBetter": [],
  "whatClientDoesBetter": [],
  "top15Recommendations": [
    {
      "priority": 1,
      "category": "",
      "recommendation": "",
      "impact": "high | medium | low",
      "effort": "low | medium | high",
      "rationale": ""
    }
  ]
}
  `;
}

  parseAnalysis(text) {
    try {
      let cleaned = text.trim();
      if (cleaned.startsWith("```"))
        cleaned = cleaned.replace(/```json?\n?/, "").replace(/\n?```$/, "");

      return JSON.parse(cleaned);

    } catch (err) {
      logger.error("Failed to parse AI JSON:", err.message);

      return {
        executiveSummary: "JSON parsing failed. Raw output returned.",
        seoComparison: { winner: "tie", keyFindings: [] },
        contentComparison: { winner: "tie", keyFindings: [] },
        uiuxComparison: { winner: "tie", keyFindings: [] },
        performanceComparison: { winner: "tie", keyFindings: [] },
        whatCompetitorDoesBetter: [],
        whatClientDoesBetter: [],
        top10Recommendations: []
      };
    }
  }
}

module.exports = new AIService();
