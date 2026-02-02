"use client";
import { useState } from "react";

export default function AnalysisForm() {
  const [clientUrl, setClientUrl] = useState("");
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://backendai-8yq3.onrender.com";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientUrl,
          competitorUrl,
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (!data.success) {
        setError(data.error || "Something went wrong.");
        return;
      }

      // Save full analysis to localStorage so results page can read it
  sessionStorage.setItem("analysisResults", JSON.stringify(data.data));
  
      // Redirect to results page
      window.location.href = "/results";

    } catch (err) {
      console.error("API error:", err);
      setLoading(false);
      setError("Server not reachable. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-10 p-6 border rounded-lg shadow">
      <h2 className="text-xl font-bold mb-3">AI Competitor Analysis</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className="border p-3 rounded"
          placeholder="Enter your website URL"
          value={clientUrl}
          onChange={(e) => setClientUrl(e.target.value)}
          required
        />

        <input
          className="border p-3 rounded"
          placeholder="Enter competitor website URL"
          value={competitorUrl}
          onChange={(e) => setCompetitorUrl(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? "Analyzing..." : "Analyze Websites"}
        </button>
      </form>

      {error && <p className="text-red-600 mt-3">{error}</p>}
    </div>
  );
}
