'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ------------------------------------------------------------------
   PDF EXPORT FUNCTION — clean multi-page A4 export with margins
-------------------------------------------------------------------*/
const downloadPDF = async () => {
  const report = document.getElementById("pdf-report");

  // Temporarily show hidden report for rendering
  report.style.display = "block";
  report.style.position = "absolute";
  report.style.left = "-9999px";
  report.style.width = "794px"; // A4 width in px

  // High-resolution HTML to canvas
  const canvas = await html2canvas(report, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true
  });

  // Hide again
  report.style.display = "none";

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  // Add remaining content across pages
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  pdf.save("AI-Competitor-Analysis-Report.pdf");
};


/* ------------------------------------------------------------------
   SCORE CALCULATION ENGINE — converts raw data → 0-100 scores
-------------------------------------------------------------------*/
const calculateScores = (client, competitor, comparison) => {
  const scores = {};

  /* SEO — More realistic and wider score range */
  scores.seoClient =
    (comparison.seo.title.client.optimal ? 25 : 10) +
    (comparison.seo.metaDescription.client.optimal ? 25 : 10) +
    (parseFloat(comparison.seo.images.client.altOptimization) / 100) * 20 +
    Math.min(comparison.seo.structuredData.client.count * 4, 20) +
    (comparison.seo.openGraph.client.title ? 5 : 0) +
    (comparison.seo.openGraph.client.description ? 5 : 0);

  scores.seoCompetitor =
    (comparison.seo.title.competitor.optimal ? 25 : 10) +
    (comparison.seo.metaDescription.competitor.optimal ? 25 : 10) +
    (parseFloat(comparison.seo.images.competitor.altOptimization) / 100) * 20 +
    Math.min(comparison.seo.structuredData.competitor.count * 4, 20) +
    (comparison.seo.openGraph.competitor.title ? 5 : 0) +
    (comparison.seo.openGraph.competitor.description ? 5 : 0);

  /* CONTENT — Wider variations */
  scores.contentClient =
    Math.min(client.wordCount / 40, 30) +
    Math.min(comparison.content.internalLinks.client * 1.5, 20) +
    Math.min(comparison.content.externalLinks.client * 1.5, 20) +
    Math.min(comparison.content.buttons.client * 4, 30);

  scores.contentCompetitor =
    Math.min(competitor.wordCount / 40, 30) +
    Math.min(comparison.content.internalLinks.competitor * 1.5, 20) +
    Math.min(comparison.content.externalLinks.competitor * 1.5, 20) +
    Math.min(comparison.content.buttons.competitor * 4, 30);

  /* UX/UI — Bigger differences */
  scores.uxClient =
    Math.min(comparison.uiux.navigation.client * 5, 40) +
    (client.responsive ? 35 : 5) +
    Math.min(comparison.uiux.ctaQuality.client.length * 5, 25);

  scores.uxCompetitor =
    Math.min(comparison.uiux.navigation.competitor * 5, 40) +
    (competitor.responsive ? 35 : 5) +
    Math.min(comparison.uiux.ctaQuality.competitor.length * 5, 25);

  /* PERFORMANCE — Major impact */
  const perf = (v) => Math.max(0, 100 - v / 20); // stronger penalty

  scores.perfClient =
    perf(client.performance.loadTime) * 0.45 +
    perf(client.performance.domContentLoaded) * 0.30 +
    perf(client.performance.firstPaint) * 0.25;

  scores.perfCompetitor =
    perf(competitor.performance.loadTime) * 0.45 +
    perf(competitor.performance.domContentLoaded) * 0.30 +
    perf(competitor.performance.firstPaint) * 0.25;

  return scores;
};

// ---------------------------------------------------------------
// WINNER DECISION HELPER
// ---------------------------------------------------------------
const decideWinner = (a, b) => {
  if (a > b) return "client";
  if (b > a) return "competitor";
  return "tie";
};




/* ------------------------------------------------------------------
   RADAR CHART MATH — convert scores to coordinates
-------------------------------------------------------------------*/
const polarToCartesian = (angle, score) => {
  const radius = (score / 100) * 120;   // 120 = max radius
  const radians = (angle - 90) * (Math.PI / 180);

  const x = 175 + radius * Math.cos(radians);
  const y = 175 + radius * Math.sin(radians);

  return [x, y];
};


/* ------------------------------------------------------------------
   MAIN COMPONENT — loads results + prepares radar + renders layout
-------------------------------------------------------------------*/
export default function ResultsPage() {
  const [results, setResults] = useState(null);
  const router = useRouter();

  /* Load sessionStorage data */
  useEffect(() => {
    const data = sessionStorage.getItem("analysisResults");
    if (!data) router.push("/");
    else setResults(JSON.parse(data));
  }, []);

  if (!results)
    return (
      <div className="loading-screen">
        <div className="loader-box">Analyzing websites…</div>
      </div>
    );

  const { analysis, summary, urls, crawlData, comparison } = results;

  /* Compute final category scores (0-100 each) */
  const s = calculateScores(crawlData.client, crawlData.competitor, comparison);
  const clientTotal = s.seoClient + s.contentClient + s.uxClient + s.perfClient;
const competitorTotal = s.seoCompetitor + s.contentCompetitor + s.uxCompetitor + s.perfCompetitor;
const winners = [
  decideWinner(s.seoClient, s.seoCompetitor),
  decideWinner(s.contentClient, s.contentCompetitor),
  decideWinner(s.uxClient, s.uxCompetitor),
  decideWinner(s.perfClient, s.perfCompetitor),
];

const overallWinner =
  winners.filter(w => w === "client").length >
  winners.filter(w => w === "competitor").length
    ? "client"
    : winners.filter(w => w === "competitor").length >
      winners.filter(w => w === "client").length
      ? "competitor"
      : "tie";


  /* Build polygon coordinate list */
  const clientPoints = [
    polarToCartesian(0, s.seoClient),
    polarToCartesian(90, s.contentClient),
    polarToCartesian(180, s.uxClient),
    polarToCartesian(270, s.perfClient),
  ];

  const competitorPoints = [
    polarToCartesian(0, s.seoCompetitor),
    polarToCartesian(90, s.contentCompetitor),
    polarToCartesian(180, s.uxCompetitor),
    polarToCartesian(270, s.perfCompetitor),
  ];

  const toPath = (pts) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]},${p[1]}`).join(" ") + " Z";


  return (
    <div className="results-container fade-in">

      {/* --------------------------------------------------------------
          HEADER — Page title + buttons
      -------------------------------------------------------------- */}
      <div
        className="header slide-up"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <h1 className="title-xl">AI Competitor Analysis</h1>

        <div style={{ display: "flex", gap: "12px" }}>
          <button className="button-primary" onClick={() => router.push("/")}>
            ← New Analysis
          </button>

          <button className="button-primary" onClick={downloadPDF}>
            📄 Download Report
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------
          COMPARED WEBSITES CARD (full width)
      -------------------------------------------------------------- */}
      <div className="form-card full-card slide-up">
        <h2 className="title-lg">Compared Websites</h2>

        <p>
          <span className="text-muted">Client:</span> {urls.client}
        </p>
        <p>
          <span className="text-muted">Competitor:</span> {urls.competitor}
        </p>

        {/* Extra mini stats */}
        <div className="extra-info-box" style={{ marginTop: "14px" }}>
          <p>
            Client Word Count:{" "}
            <strong>{crawlData.client.wordCount} words</strong>
          </p>
          <p>
            Competitor Word Count:{" "}
            <strong>{crawlData.competitor.wordCount} words</strong>
          </p>
          <p>
            Client Internal Links:{" "}
            <strong>{comparison.content.internalLinks.client}</strong>
          </p>
          <p>
            Competitor Internal Links:{" "}
            <strong>{comparison.content.internalLinks.competitor}</strong>
          </p>
        </div>
      </div>

      {/* --------------------------------------------------------------
          EXECUTIVE SUMMARY — auto-generated by AI engine
      -------------------------------------------------------------- */}
      <div className="form-card full-card slide-up">
        <h2 className="title-lg">Executive Summary</h2>

        <p className="text-muted" style={{ lineHeight: 1.6 }}>
          {analysis.executiveSummary}
        </p>

        {/* Score Gap Breakdown */}
        <div className="summary-stats" style={{ marginTop: "18px" }}>
          <p>
            SEO Score Gap:{" "}
            <strong>
              {Math.abs(Math.round(s.seoClient - s.seoCompetitor))}
            </strong>
          </p>
          <p>
            Content Depth Gap:{" "}
            <strong>
              {Math.abs(Math.round(s.contentClient - s.contentCompetitor))}
            </strong>
          </p>
          <p>
            UX Strength Gap:{" "}
            <strong>
              {Math.abs(Math.round(s.uxClient - s.uxCompetitor))}
            </strong>
          </p>
          <p>
            Performance Gap:{" "}
            <strong>
              {Math.abs(Math.round(s.perfClient - s.perfCompetitor))}
            </strong>
          </p>
        </div>

        {/* Overall Winner */}
        <div className="winner-badge">
          Overall Winner:{" "}
          <strong>{overallWinner.toUpperCase()}</strong>
        </div>
      </div>


      {/* ============================================================
          RADAR + 2×2 COMPARISON SCORECARDS
      ============================================================ */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "35px",
          marginTop: "40px",
          width: "100%",
        }}
      >
        {/* ----------------------------------------------------------
            LEFT SIDE — 2×2 GRID of Score Comparison Cards
        ---------------------------------------------------------- */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            columnGap: "20px",
            rowGap: "10px", // reduced gap for compact alignment
          }}
        >
          {[
            ["SEO Comparison", s.seoClient, s.seoCompetitor, analysis.seoComparison.winner],
            ["Content Comparison", s.contentClient, s.contentCompetitor, analysis.contentComparison.winner],
            ["UI/UX Comparison", s.uxClient, s.uxCompetitor, analysis.uiuxComparison.winner],
            ["Performance Comparison", s.perfClient, s.perfCompetitor, analysis.performanceComparison.winner],
          ].map(([title, clientScore, compScore, winner], i) => (
            <div
              key={i}
              className="form-card"
              style={{
                padding: "16px",
                width: "100%",
                minWidth: "240px",
                margin: 0,
              }}
            >
              <h3 className="title-sm" style={{ marginBottom: "8px" }}>
                {title}
              </h3>

              {/* CLIENT SCORE BAR */}
              <p className="text-muted">Client Score</p>
              <div className="progress-bar small">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.round(clientScore)}%` }}
                >
                  <span className="bar-label small">
                    {Math.round(clientScore)}%
                  </span>
                </div>
              </div>

              {/* COMPETITOR SCORE BAR */}
              <p className="text-muted" style={{ marginTop: "8px" }}>
                Competitor Score
              </p>
              <div className="progress-bar small">
                <div
                  className="progress-fill competitor"
                  style={{ width: `${Math.round(compScore)}%` }}
                >
                  <span className="bar-label small">
                    {Math.round(compScore)}%
                  </span>
                </div>
              </div>

              {/* Winner Label */}
              <div className="winner-tag small" style={{ marginTop: "10px" }}>
                Winner: {decideWinner(clientScore, compScore).toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        {/* ----------------------------------------------------------
            RIGHT SIDE — RADAR GRAPH
        ---------------------------------------------------------- */}
        <div
          style={{
            width: "420px",
            minWidth: "420px",
            marginTop: "10px",
          }}
        >
          <div className="radar-container">
            <svg className="radar-svg" viewBox="0 0 350 350">
              {/* Rings */}
              <circle cx="175" cy="175" r="40" className="radar-ring" />
              <circle cx="175" cy="175" r="80" className="radar-ring" />
              <circle cx="175" cy="175" r="120" className="radar-ring" />

              {/* Axis Lines */}
              <line x1="175" y1="175" x2="175" y2="40" stroke="#3d3d3d" />
              <line x1="175" y1="175" x2="310" y2="175" stroke="#3d3d3d" />
              <line x1="175" y1="175" x2="175" y2="310" stroke="#3d3d3d" />
              <line x1="175" y1="175" x2="40" y2="175" stroke="#3d3d3d" />

              {/* Polygons */}
              <path
                className="radar-polygon-client"
                d={toPath(clientPoints)}
              />
              <path
                className="radar-polygon-competitor"
                d={toPath(competitorPoints)}
              />

              {/* Labels */}
              <text x="175" y="25" className="radar-label">
                SEO
              </text>
              <text x="330" y="182" className="radar-label">
                Content
              </text>
              <text x="175" y="340" className="radar-label">
                UX/UI
              </text>
              <text x="20" y="182" className="radar-label">
                Performance
              </text>
            </svg>
          </div>

          {/* Radar Legend */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "18px",
              marginTop: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  background: "rgba(56,189,248,0.7)",
                  borderRadius: "3px",
                }}
              ></div>
              <span style={{ color: "#ccc", fontSize: "14px" }}>Client</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  background: "rgba(168,85,247,0.7)",
                  borderRadius: "3px",
                }}
              ></div>
              <span style={{ color: "#ccc", fontSize: "14px" }}>
                Competitor
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          HEATMAP — Category Winners
      ============================================================ */}
      <div className="heatmap-card fade-in-delayed">
        <h2 className="title-lg">Winner Heatmap</h2>

        {[
          ["SEO", decideWinner(s.seoClient, s.seoCompetitor)],
          ["Content", decideWinner(s.contentClient, s.contentCompetitor)],
          ["UI/UX", decideWinner(s.uxClient, s.uxCompetitor)],
          ["Performance", decideWinner(s.perfClient, s.perfCompetitor)],
        ].map(([label, winner], i) => (
          <div className="heatmap-row" key={i}>
            <span className="heatmap-label">{label}</span>

            <span
              className={
                winner === "client"
                  ? "heatmap-winner-client"
                  : winner === "competitor"
                    ? "heatmap-winner-competitor"
                    : "heatmap-winner-tie"
              }
            >
              {winner}
            </span>
          </div>
        ))}
      </div>


      {/* ============================================================
          TOP 15 RECOMMENDATIONS
      ============================================================ */}
      <div className="form-card full-card slide-up">
        <h2 className="title-lg">Top 15 Recommendations</h2>

        {analysis.top15Recommendations?.map((rec, i) => (
          <div key={i} className="recommendation-card fade-in">
            {/* Header row: # + category */}
            <div className="recommendation-header">
              <span className="recommendation-number">#{rec.priority}</span>
              <span className="recommendation-category">{rec.category}</span>
            </div>

            {/* Recommendation title */}
            <p className="recommendation-title">{rec.recommendation}</p>

            {/* Impact + Effort badges */}
            <div className="badge-row">
              <span className={`badge badge-${rec.impact}`}>
                {rec.impact} impact
              </span>
              <span className={`badge badge-${rec.effort}`}>
                {rec.effort} effort
              </span>
            </div>

            {/* Rationale text */}
            <p className="recommendation-rationale">{rec.rationale}</p>
          </div>
        ))}
      </div>

      {/* ============================================================
          PDF EXPORT TEMPLATE — CLEAN PROFESSIONAL A4 LAYOUT
          Used only by jsPDF + html2canvas
      ============================================================ */}
      <div
        id="pdf-report"
        style={{
          display: "none",
          position: "absolute",
          left: "-9999px",
          top: "0",
          padding: "40px 40px",
          background: "#ffffff",
          color: "#000",
          fontFamily: "Arial, sans-serif",
          lineHeight: 1.6,
          width: "794px", // perfect A4 width for HTML → PDF
          boxSizing: "border-box",
        }}
      >
        {/* ---------------- HEADER ---------------- */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "25px",
            borderBottom: "2px solid #222",
            paddingBottom: "10px",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "26px" }}>
            AI Competitor Analysis Report
          </h1>

          <div style={{ textAlign: "right", fontSize: "12px" }}>
            <strong>Date:</strong> {new Date().toLocaleDateString()}
            <br />
            <strong>Generated By:</strong> Shashank AI
          </div>
        </div>

        {/* ---------------- URL SECTION ---------------- */}
        <h2
          style={{
            fontSize: "20px",
            borderLeft: "5px solid #444",
            paddingLeft: "10px",
          }}
        >
          Compared Websites
        </h2>

        <p>
          <strong>Client:</strong> {urls.client}
        </p>
        <p>
          <strong>Competitor:</strong> {urls.competitor}
        </p>

        {/* URL DETAIL BOX */}
        <div
          style={{
            background: "#f7f7f7",
            padding: "12px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            marginBottom: "20px",
          }}
        >
          <p>
            <strong>Client Word Count:</strong> {crawlData.client.wordCount}
          </p>
          <p>
            <strong>Competitor Word Count:</strong>{" "}
            {crawlData.competitor.wordCount}
          </p>
          <p>
            <strong>Client Internal Links:</strong>{" "}
            {comparison.content.internalLinks.client}
          </p>
          <p>
            <strong>Competitor Internal Links:</strong>{" "}
            {comparison.content.internalLinks.competitor}
          </p>
        </div>

        {/* ---------------- EXEC SUMMARY ---------------- */}
        <h2
          style={{
            fontSize: "20px",
            borderLeft: "5px solid #444",
            paddingLeft: "10px",
          }}
        >
          Executive Summary
        </h2>

        <p style={{ marginBottom: "12px" }}>{analysis.executiveSummary}</p>

        {/* GAPS BOX */}
        <div
          style={{
            marginBottom: "24px",
            background: "#fafafa",
            padding: "12px",
            borderRadius: "6px",
            border: "1px solid #ddd",
          }}
        >
          <p>
            SEO Score Gap:{" "}
            <strong>
              {Math.abs(Math.round(s.seoClient - s.seoCompetitor))}
            </strong>
          </p>
          <p>
            Content Depth Gap:{" "}
            <strong>
              {Math.abs(Math.round(s.contentClient - s.contentCompetitor))}
            </strong>
          </p>
          <p>
            UX Strength Gap:{" "}
            <strong>
              {Math.abs(Math.round(s.uxClient - s.uxCompetitor))}
            </strong>
          </p>
          <p>
            Performance Gap:{" "}
            <strong>
              {Math.abs(Math.round(s.perfClient - s.perfCompetitor))}
            </strong>
          </p>
        </div>

        {/* ---------------- SCORE TABLE ---------------- */}
        <h2
          style={{
            fontSize: "20px",
            borderLeft: "5px solid #444",
            paddingLeft: "10px",
          }}
        >
          Score Comparison
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "30px",
          }}
        >
          <thead>
            <tr style={{ background: "#eee" }}>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Metric
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Client
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Competitor
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Winner
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                SEO
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {Math.round(s.seoClient)}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {Math.round(s.seoCompetitor)}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {decideWinner(s.seoClient, s.seoCompetitor)}
              </td>
            </tr>

            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                Content
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {Math.round(s.contentClient)}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {Math.round(s.contentCompetitor)}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {decideWinner(s.contentClient, s.contentCompetitor)}
              </td>
            </tr>

            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                UX/UI
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {Math.round(s.uxClient)}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {Math.round(s.uxCompetitor)}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {decideWinner(s.uxClient, s.uxCompetitor)}
              </td>
            </tr>

            <tr>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                Performance
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {Math.round(s.perfClient)}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {Math.round(s.perfCompetitor)}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
               {decideWinner(s.perfClient, s.perfCompetitor)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ---------------- RECOMMENDATIONS LIST ---------------- */}
        <h2
          style={{
            fontSize: "20px",
            borderLeft: "5px solid #444",
            paddingLeft: "10px",
          }}
        >
          Top 15 Recommendations
        </h2>

        {analysis.top15Recommendations.map((rec, i) => (
          <div
            key={i}
            style={{
              background: "#fafafa",
              border: "1px solid #ddd",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "10px",
            }}
          >
            <strong>
              #{rec.priority} — {rec.category}
            </strong>
            <p style={{ margin: "6px 0" }}>{rec.recommendation}</p>
            <small style={{ opacity: 0.7 }}>{rec.rationale}</small>
          </div>
        ))}

        {/* ---------------- FOOTER ---------------- */}
        <div
          style={{
            borderTop: "1px solid #ccc",
            marginTop: "30px",
            paddingTop: "10px",
            textAlign: "center",
            fontSize: "12px",
          }}
        >
          © 2026 • Shashank AI Competitor Analysis
        </div>
      </div>
    </div>
  );
}
