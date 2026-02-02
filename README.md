# 🤖 AI Competitor Analysis Bot

A comprehensive full-stack application that crawls, compares, and analyzes websites using AI to provide actionable competitive insights.

## 🚀 Features

- **Complete Website Crawling**: Extract titles, meta descriptions, headings (H1-H6), links, images, CTAs, schema, and all text content
- **Deep Comparison**: Compare SEO, content depth, UI/UX, performance, and navigation structure
- **AI-Powered Analysis**: Uses Claude (Anthropic) to generate strategic insights and recommendations
- **Structured Reports**: Get detailed comparisons with top 10 priority recommendations
- **Modern UI**: Clean Next.js frontend with beautiful results display
- **RESTful API**: Well-structured Node.js backend with Express

## 📁 Project Structure

```
ai-competitor-analysis/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── analysisController.js    # Main analysis orchestration
│   │   ├── services/
│   │   │   ├── crawlerService.js        # Playwright-based web crawler
│   │   │   ├── comparisonService.js     # Data comparison logic
│   │   │   └── aiService.js             # Claude AI integration
│   │   ├── utils/
│   │   │   ├── logger.js                # Logging utility
│   │   │   └── validators.js            # Input validation
│   │   ├── routes/
│   │   │   └── analysisRoutes.js        # API routes
│   │   └── server.js                     # Express server setup
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── page.js                   # Homepage with form
│   │       ├── layout.js                 # Root layout
│   │       └── results/
│   │           └── page.js               # Results display
│   ├── package.json
│   └── next.config.js
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Anthropic API key

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Add your Anthropic API key to `.env`:
```env
PORT=3001
ANTHROPIC_API_KEY=your_anthropic_api_key_here
NODE_ENV=development
MAX_CRAWL_DEPTH=3
TIMEOUT=60000
```

5. Install Playwright browsers:
```bash
npx playwright install chromium
```

6. Start the backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## 📡 API Documentation

### POST `/api/analyze`

Analyzes and compares two websites.

**Request Body:**
```json
{
  "clientUrl": "https://yourwebsite.com",
  "competitorUrl": "https://competitor.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-01-22T10:30:00.000Z",
    "clientUrl": "https://yourwebsite.com",
    "competitorUrl": "https://competitor.com",
    "crawlData": {
      "client": { ... },
      "competitor": { ... }
    },
    "comparison": {
      "seo": { ... },
      "content": { ... },
      "uiux": { ... },
      "technical": { ... },
      "performance": { ... }
    },
    "analysis": {
      "executiveSummary": "...",
      "seoComparison": { ... },
      "contentComparison": { ... },
      "uiuxComparison": { ... },
      "performanceComparison": { ... },
      "whatCompetitorDoesBetter": [...],
      "whatClientDoesBetter": [...],
      "top10Recommendations": [...]
    },
    "summary": {
      "overallWinner": "client|competitor|tie",
      "quickStats": { ... }
    }
  }
}
```

## 🔍 What Gets Analyzed

### SEO Analysis
- Title tags (length and optimization)
- Meta descriptions
- Heading structure (H1-H6)
- Image alt text optimization
- Structured data (Schema.org)
- Canonical URLs
- Open Graph tags
- Robots meta tags
- Language attributes

### Content Analysis
- Word count
- Content depth
- Internal/external link counts
- CTA/Button analysis
- Navigation structure
- Content hierarchy

### UI/UX Analysis
- Navigation links
- Call-to-action elements
- Responsive design indicators
- Viewport configuration
- User flow elements

### Performance Metrics
- Page load time
- DOM content loaded time
- First paint time
- Resource optimization

## 🎯 Sample Response Structure

```json
{
  "executiveSummary": "Client site shows strong SEO fundamentals but competitor leads in content depth and user engagement features...",
  "seoComparison": {
    "winner": "competitor",
    "keyFindings": [
      "Competitor has 45% more structured data implementations",
      "Client title tags are within optimal range (50-60 chars)",
      "Competitor images have 92% alt text coverage vs client's 67%"
    ],
    "clientStrengths": [
      "Well-optimized meta descriptions",
      "Clean heading hierarchy with single H1"
    ],
    "clientWeaknesses": [
      "Missing schema markup for products",
      "Low image alt text coverage"
    ]
  },
  "top10Recommendations": [
    {
      "priority": 1,
      "category": "SEO",
      "recommendation": "Implement product schema markup across all product pages",
      "impact": "high",
      "effort": "medium",
      "rationale": "Competitor has rich snippets in search results, leading to 23% higher CTR"
    }
  ]
}
```

## 🧠 AI Analysis Prompt

The system uses a comprehensive prompt that instructs Claude to:

1. Analyze both websites across multiple dimensions
2. Identify specific competitive advantages and gaps
3. Prioritize recommendations based on impact vs effort
4. Focus on actionable, data-driven insights
5. Avoid generic advice

The prompt emphasizes:
- Technical SEO opportunities
- Content strategy improvements
- User experience enhancements
- Performance optimizations
- Clear ROI-focused recommendations

## 🔧 Technical Stack

**Backend:**
- Node.js + Express
- Playwright (web crawling)
- Cheerio (HTML parsing)
- Anthropic Claude API (AI analysis)

**Frontend:**
- Next.js 14
- React 18
- Native CSS-in-JS

## 📊 Use Cases

1. **Competitive Intelligence**: Understand what competitors are doing better
2. **SEO Audits**: Identify technical and content SEO gaps
3. **Website Redesign Planning**: Get data-driven insights before redesigning
4. **Content Strategy**: See what content approaches work for competitors
5. **Performance Benchmarking**: Compare load times and technical metrics

## ⚠️ Limitations

- Analysis time: 30-60 seconds per comparison
- Best for public websites (requires no authentication)
- Single-page crawl (doesn't follow internal links)
- Rate limiting on API requests recommended for production

## 🚀 Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use PM2 or similar process manager
3. Set up proper logging and monitoring
4. Configure CORS for your frontend domain
5. Add rate limiting middleware

### Frontend
1. Build: `npm run build`
2. Start: `npm run start`
3. Deploy to Vercel, Netlify, or any Node.js host

## 🤝 Contributing

This is a complete working solution. To extend:

1. Add multi-page crawling
2. Implement result caching
3. Add PDF export functionality
4. Create comparison history
5. Add more AI analysis categories

## 📝 License

MIT License - feel free to use for commercial projects

## 🆘 Troubleshooting

**"Failed to crawl" errors:**
- Check if URLs are accessible
- Verify Playwright is installed: `npx playwright install`
- Check firewall/proxy settings

**"AI analysis failed":**
- Verify Anthropic API key is valid
- Check API rate limits
- Ensure sufficient API credits

**Frontend connection errors:**
- Verify backend is running on port 3001
- Check CORS configuration
- Verify network connectivity

## 📞 Support

For issues or questions:
1. Check existing issues in repository
2. Review API documentation
3. Verify all environment variables are set
4. Check logs for specific error messages

---

Built with ❤️ using Node.js, Express, Playwright, and Claude AI