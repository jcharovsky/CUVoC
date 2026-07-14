 AI-Native Engineer Takehome

Build a small Voice of Customer analysis product from anonymized support tickets. Use the API to ingest raw customer issue data, design an AI or hybrid analysis pipeline, and present findings in a UI, notebook, or short report.

## API

Base URL: `https://voc-analysis-tool.vercel.app`

Authentication: `TAKEHOME_API_KEY` (stored locally in `.env`).

Endpoints:

- `GET /api/takehome/v1/meta` returns dataset coverage, field definitions, caveats, and endpoint metadata.
- `GET /api/takehome/v1/tickets?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&limit=50` returns anonymized ticket records.
- If the ticket response includes `next_cursor`, request the next page with `cursor=<next_cursor>`.

Example:

```bash
curl -H "Authorization: Bearer $TAKEHOME_API_KEY" \
  "https://voc-analysis-tool.vercel.app/api/takehome/v1/tickets?limit=50"
```

Ticket records include stable anonymized ticket IDs, ticket date, channel, contact reason labels, operational/customer outcome signals, and redacted public customer messages. Existing internal AI labels are intentionally withheld.

The export is capped at 10,000 eligible tickets, ordered backward from May 1, 2026 into April 23, 2026. Use next_cursor until it returns null.

## Assignment

Create an AI-native analysis pipeline that helps a support or product leader understand what customers are contacting support about, which themes are growing, and which issues appear tied to bad outcomes like low CSAT, churn, long resolution time, or repeat messages.

You may use LLMs, embeddings, clustering, classifiers, rules, agents, or conventional analytics. The exact stack is up to you.

Expected deliverables:

- Working ingestion from the API, including pagination.
- A theme discovery or classification approach with evidence from customer messages.
- At least one trend, segment, or outcome analysis.
- A small interactive UI, notebook, or generated report.
- A brief writeup explaining your architecture, assumptions, failure modes, and next steps.

Evaluation criteria:

- Product judgment: Are the insights useful and understandable?
- AI engineering: Is the pipeline grounded, explainable, and robust to noisy text?
- Data handling: Are pagination, missing fields, and sensitive text handled responsibly?
- Execution: Is the result easy to run, inspect, and extend?