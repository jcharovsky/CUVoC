# Architecture

## Purpose

This document records the **implemented architecture, its consequential decisions, and its known limits**. It does not describe planned components.

## Preparation

### System Overview

The **Preparation process is encapsulated in `preparation/preparation.ipynb`**. The notebook invokes ingestion, loads the resulting local exports, presents the phase's code and reasoning in execution order, and remains output-free in version control to avoid sensitive data leakage.

The notebook also **profiles the raw dataset before cleaning**. It compares documented and observed fields, validates ticket and date coverage against the assignment, measures missingness and data types, and inspects categorical distributions.

Cleaning then **creates a separate `prepared_tickets` dataset**. It preserves the raw export, casts the fields required for analysis, and validates that the ticket population, source fields, date parsing, and intended data types remain intact.

CUVoC contains a **local batch ingestion pipeline**. `preparation/modules/ingestion.py` authenticates to the take-home API, retrieves metadata and all ticket pages, then saves local raw JSON artifacts under Git-ignored `preparation/data/` to prevent confidential data exposure.

### Data Flow

1. The notebook invokes the ingestion module, which reads `TAKEHOME_API_KEY` from the process environment or local `.env` file, then retrieves and validates API metadata.
2. The module retrieves ticket pages until `next_cursor` is `null`, with optional date filters on the initial request.
3. It validates ticket IDs, skips duplicates, and retries transient request failures.
4. It atomically writes `metadata.json` and `tickets.json` after the complete export succeeds.
5. The notebook loads those artifacts into tabular structures and profiles schema alignment, coverage, data quality, and categorical distributions.
6. It copies the raw ticket table into `prepared_tickets`, casts `ticket_date`, `has_churn`, `plan_size`, `first_response_minutes`, and `csat`, then validates the prepared dataset.
7. It writes `prepared_tickets.parquet` to Git-ignored `enrichment/data/`, the input directory owned by the next phase.

### Design Decisions

| Decision | Rationale |
| --- | --- |
| **Standard-library implementation** | The export runs without third-party runtime dependencies. |
| **Complete export before persistence** | A failed pagination run cannot be mistaken for a complete dataset. |
| **Separate raw JSON artifacts** | API metadata remains available with the exported tickets. |
| **Validation, retries, and deduplication** | Incompatible responses fail visibly, while transient failures and duplicate IDs are handled safely. |
| **Profile before cleaning** | Field alignment, coverage, missingness, and categorical cardinality inform later cleaning decisions without altering the raw export. |
| **Non-destructive casting** | `prepared_tickets` retains every source field and ticket while applying analytical types without imputing, excluding, or reinterpreting sparse values. |
| **Outputless committed notebooks** | Git strips notebook output on staging, and `tools/check_notebook_outputs.py` rejects staged notebooks with executable state through the tracked pre-commit hook. Every clone enables the hook with `git config core.hooksPath .githooks`. |
| **Local raw data** | `preparation/data/` is Git-ignored, so exported tickets do not enter version control. |

### Assumptions and Failure Modes

| Assumption or failure mode | Pipeline behaviour |
| --- | --- |
| **The credential accesses both API endpoints.** | Authentication and client errors stop the run. |
| **The API can fail transiently.** | The script retries transient network and server failures before exiting non-zero. |
| **Responses match the required core schema.** | Missing metadata, invalid cursors, malformed ticket pages, and absent ticket IDs stop the run. |
| **Ticket IDs are stable.** | Duplicates are skipped and reported to standard error. |
| **A run can be interrupted.** | No partial target JSON file is written, but a failed pagination run retains no partial progress. |
| **Documented and observed fields align.** | Profiling records discrepancies. Cleaning applies `response_minutes` to `first_response_minutes` as the provisional metadata-to-dataset mapping and retains the observed field as canonical. |
| **Dates and analytical fields can be cast safely.** | Cleaning coerces invalid dates or numeric values to missing, uses nullable types where needed, and validates the resulting dataset. |
| **Sparse fields can support every planned comparison.** | `event_category` and `csat` have limited coverage, so later analysis must account for their smaller populations. |
| **Notebook output can expose raw data.** | The Git filter removes output before staging, while the pre-commit check verifies the staged notebook content. |

## Enrichment

### System Overview

The **Enrichment notebook at `enrichment/enrichment.ipynb` imports the prepared Parquet dataset** from its local `data/` directory. Qwen3 8B is installed locally through Ollama as `qwen3:8b`; no ticket text has yet been sent to the model.

### Model Selection

**Qwen3 8B is the selected model for local ticket classification.** Its 5.2 GB Q4 quantization leaves practical headroom on the M1 Pro with 16 GB unified memory, while Ollama uses Apple Metal acceleration for inference.

Ollama is the **local model runtime**. The model weights are downloaded with `ollama pull qwen3:8b`, while ticket text is supplied only to the local runtime. The [official Ollama documentation](https://docs.ollama.com/) covers installation and runtime configuration.

### Text Profiling

**Text profiling preserves one customer-message sequence per ticket.** It verifies that every collection is list-like and contains strings, normalizes the Parquet-loaded arrays into Python lists, and checks their lengths against `customer_message_count`.

The source does not provide message-level timestamps. Later enrichment therefore preserves source-array order as message position, without treating that position as a chronological timestamp.

### Assumptions and Failure Modes

| Assumption or failure mode | Pipeline behaviour |
| --- | --- |
| **The local model fits available memory.** | Qwen3 8B is selected over larger variants to avoid memory pressure during enrichment. |
| **The Ollama service is available locally.** | Model calls cannot begin until the local runtime and `qwen3:8b` model are available. |
| **Local inference protects ticket text.** | The classifier must call only the local Ollama endpoint, never a cloud inference provider. |
| **Message collections align with source counts.** | Profiling validates each sequence against `customer_message_count` before any model labels are added. |

## Presentation

### System Overview

The Presentation phase is a self-contained responsive Next.js application in `presentation/`. Its `app/page.tsx` route renders the interactive dashboard from `components/`, while `data/dashboard.ts` provides the typed boundary that later analysis artifacts replace. The displayed metrics, trends, themes, top signal, and written signal analysis all come from this shared source.

The overview includes workspace navigation, reporting-period controls, key outcome metrics, an SVG trend view, prioritized signals, searchable theme exploration, and a compact question-and-answer panel. Its current values are explicitly labeled as illustrative because the Analysis phase has not produced validated dashboard artifacts yet.

The assistant is encapsulated behind `POST /api/chat`. The route validates the latest browser-local user question, supplies an explicit allowlist of aggregate `dashboardData` fields to an OpenAI Responses model through Vercel AI SDK, and streams the answer to `components/chat-panel.tsx`. The API key and optional model override remain server-side environment variables.

### Data Flow

1. The dashboard and server-side assistant import the same typed `dashboardData` artifact.
2. Either Ask control opens the browser-local chat panel without navigating away from the overview.
3. The panel sends its messages to `POST /api/chat` and displays `Thinking...` until response text begins streaming.
4. The route accepts only the latest text-only user question, rejects malformed input, and limits the question to 500 characters. Client-supplied assistant history never reaches the model.
5. The route combines the question with instructions and an allowlisted projection of aggregate metrics, chart series, themes, and written analysis, then allows up to 8,192 combined reasoning and answer tokens within a 60-second server execution window.
6. OpenAI response storage is disabled, and the streamed answer remains only in the mounted browser session.

### Design Decisions

| Decision | Rationale |
| --- | --- |
| **Self-contained Presentation phase** | Framework configuration, dependencies, public assets, components, and data contracts share one phase-owned application root. |
| **Vercel Presentation root** | The Vercel project uses `presentation` as its Root Directory for builds and deployments. |
| **Typed local data boundary** | Placeholder values can be replaced with validated static artifacts or an API without changing the visual components. |
| **One source for visuals and answers** | An explicit allowlist derives the assistant context from the same metrics, chart series, and analysis text that the dashboard renders, preventing drift without exposing unrelated future fields. |
| **Dependency-light charting** | The initial trend chart uses accessible SVG markup and avoids committing to a visualization library before analytical requirements stabilize. |
| **Explicit illustrative-data label** | Placeholder findings cannot be mistaken for results from the ticket analysis. |
| **Direct OpenAI integration** | Vercel AI SDK handles browser chat state and response streaming, while the direct provider keeps a single inference dependency and server-held credential. |
| **Generous response budget** | GPT-5 mini uses low reasoning effort, medium text verbosity, and an 8,192-token combined allowance so broad questions have ample reasoning headroom before emitting a useful answer. The route permits 60 seconds for cold starts and inference, while `OPENAI_MODEL` retains deployment-level override control. |
| **Grounded conversational synthesis** | Broad questions receive a plain-language summary followed by connected explanations of the main metrics, strongest signal, and notable trend. Focused questions remain brief, while exact-value, no-invention, and scope guardrails apply to every answer. |
| **Full-context grounding** | The small curated artifact fits in every request, so retrieval, vector storage, file search, graph vision, tools, and web access add no useful capability. |
| **Stateless, single-question endpoint** | Conversation display stays in the browser, while each model request receives only the latest question. This avoids a database, fabricated assistant history, user identity, and a retention policy. |
| **Bounded assistant interface** | Question length, output length, text-only content, explicit context fields, and scope instructions constrain cost, data exposure, and off-topic behavior. |
| **Aggregate-only cloud boundary** | Raw tickets and customer messages remain in the local pipeline. Only allowlisted curated aggregates and written findings enter an OpenAI request. |
| **Minimal chat surface** | A single drawer, message list, input, streaming state, and error state cover the intended interaction without competing with the dashboard. |

### Assumptions and Failure Modes

| Assumption or failure mode | Dashboard behaviour |
| --- | --- |
| **Analysis outputs are not available yet.** | Typed illustrative values exercise every primary dashboard surface. |
| **The dashboard is viewed on different devices.** | Navigation collapses on small screens, metric cards reflow, and wide tabular content scrolls horizontally. |
| **JavaScript is available.** | Search, theme selection, reporting-period selection, and mobile navigation use client-side state. |
| **A future artifact changes shape.** | The typed data boundary makes incompatible values fail during the production build. |
| **`OPENAI_API_KEY` is absent.** | The chat endpoint returns `503`, and the panel reports that the assistant is unavailable while the dashboard remains usable. |
| **The model or provider request fails.** | The streaming request ends in an inline error without affecting dashboard state. |
| **A question is unrelated or unsupported.** | Model instructions require a fixed scope response for off-topic questions and an explicit insufficient-data response for unsupported dashboard questions. |
| **A client sends oversized, malformed, non-text, or role-invalid messages.** | Server validation rejects the request before inference. |
| **The public endpoint is abused.** | Application-level message and output bounds limit each request, but deployment-level rate limiting and account budgets remain required operational controls. |
| **The panel is closed or the page reloads.** | The in-memory conversation is discarded because no chat data is persisted. |

## Next Steps

TBD
