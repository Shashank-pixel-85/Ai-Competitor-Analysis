'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [clientUrl, setClientUrl] = useState('');
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // ⭐ FIXED — backend URL handling
  const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "https://backendai-8yq3.onrender.com"; // your Render backend

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientUrl, competitorUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Analysis failed');
      }

      // ⭐ FIXED — match your results page
      sessionStorage.setItem('analysisResults', JSON.stringify(data.data));

      router.push('/results');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1
          style={{
            ...styles.title,
            display: "flex",
            alignItems: "center",
            gap: "9px",
            justifyContent: "center",
          }}
        >
          <img
            src="bot.png"
            alt="AI Bot Icon"
            style={{
              width: "80px",
              height: "80px",
              objectFit: "contain",
              filter: "drop-shadow(0px 0px 6px rgba(0,0,0,0.5))",
            }}
          />
          AI Competitor Analysis
        </h1>

        <p style={styles.subtitle}>
          Compare your website with competitors using AI-powered insights
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Your Website URL</label>
            <input
              type="url"
              value={clientUrl}
              onChange={(e) => setClientUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Competitor Website URL</label>
            <input
              type="url"
              value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              placeholder="https://competitor.com"
              required
              style={styles.input}
            />
          </div>

          {error && <div style={styles.error}>⚠️ {error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? '🔄 Analyzing...' : '🚀 Start Analysis'}
          </button>
        </form>

        <div style={styles.features}>
          <div style={styles.feature}>✓ SEO Analysis</div>
          <div style={styles.feature}>✓ Content Comparison</div>
          <div style={styles.feature}>✓ UX/UI Insights</div>
          <div style={styles.feature}>✓ Performance Metrics</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: "radial-gradient(circle at top, #3a3a3a 0%, #1f1f1f 45%, #141414 100%)",
    backgroundAttachment: "fixed",
  },
  card: {
    maxWidth: "600px",
    width: "100%",
    padding: "40px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
  },
  title: {
    fontSize: '35px',
    fontWeight: '700',
    marginBottom: '10px',
    background: 'linear-gradient(135deg, #f0e626 0%, #d92f19 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#efe3e3',
    marginBottom: '40px',
    fontSize: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#adaaaa',
  },
  input: {
    padding: "12px 16px",
    borderRadius: "10px",
    fontSize: "15px",
    outline: "none",
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#cec6c6",
    transition: "0.3s ease",
  },
  button: {
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #da7347 0%, #e8ac16 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    marginTop: '10px',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  error: {
    padding: '12px',
    background: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    color: '#c33',
    fontSize: '14px',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '30px',
  },
  feature: {
    padding: "10px",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.15)",
    fontSize: "13px",
    textAlign: "center",
    color: "#5dd53c",
  },
};
