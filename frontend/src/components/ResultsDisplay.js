"use client";
import { useEffect, useState } from "react";

export default function ResultsDisplay() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    const json = sessionStorage.getItem("analysisResults");
    if (json) {
      setReport(JSON.parse(json));
    }
  }, []);

  if (!report) return <p className="p-5">No report found. Please run analysis first.</p>;

  const { summary, comparison, analysis, crawlData } = report;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Analysis Results</h1>

      <div className="border rounded p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">Overall Winner</h2>
        <p className="text-lg">
          🏆 <strong>{summary.overallWinner.toUpperCase()}</strong>
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">Quick Stats</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(summary.quickStats, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">Comparison</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(comparison, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">AI Insights</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(analysis, null, 2)}
        </pre>
      </div>
    </div>
  );
}
