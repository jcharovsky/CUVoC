# CUVoC

CUVoC (CookUnity Voice of Customer) is an AI-native analysis pipeline that helps CookUnity's support and product leaders understand what customers are contacting support about, which themes are growing, and which issues appear tied to bad outcomes.

## Phases

The pipeline has four phases:

1. **Preparation:** ingest, profile, clean, and preserve viable source variables for reliable downstream use.
2. **Enrichment:** turn customer-message text into structured theme and sentiment signals with a validated local-model pipeline.
3. **Analysis:** select relevant source and enriched variables, quantify trends, segments, and outcome associations, then prioritise evidence-backed findings.
4. **Presentation:** present findings in an interactive dashboard with a data-grounded question-and-answer assistant.

**The repository is organized by phase rather than file type**, making the end-to-end process easier to inspect and explain.

## Documentation

- [Assignment](docs/assignment.md)
- [Research](docs/research.md)
- [Architecture](docs/architecture.md)