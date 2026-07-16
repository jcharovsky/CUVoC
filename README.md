# CUVoC

CUVoC (CookUnity Voice of Customer) is an AI-native analysis pipeline that helps CookUnity's support and product leaders understand what customers are contacting support about, which themes are growing, and which issues appear tied to bad outcomes.

## Phases

The pipeline has four phases:

1. **Preparation:** ingest, profile, clean, and preserve viable source variables for reliable downstream use.
2. **Enrichment:** turn customer-message text into structured issue, subissue, sentiment, and emotion signals with a validated hybrid pipeline.
3. **Analysis:** select relevant source and enriched variables, quantify trends, segments, and outcome associations, then prioritise evidence-backed findings.
4. **Presentation:** communicate validated findings through a notebook and interactive dashboard, with a grounded assistant as an optional exploration aid.

**The repository is organized by phase rather than file type**, making the end-to-end process easier to inspect and explain.

## Documentation

- [Assignment](docs/assignment.md)
- [Research](docs/research.md)
- [Architecture](docs/architecture.md)

## Dashboard

The interactive dashboard runs as a self-contained Next.js application in `presentation/`. It currently presents an illustrative overview shell with responsive navigation, period controls, metrics, trends, signals, and theme exploration.

```bash
cd presentation
npm install
npm run dev
```
