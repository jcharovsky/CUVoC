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

The **Enrichment notebook at `enrichment/enrichment.ipynb` imports the prepared Parquet dataset** from its local `data/` directory. It includes a local Ollama benchmark that compares Qwen3 4B and 8B, then selects Qwen3 8B for classification. No ticket text has yet been sent to the model.

### Model Benchmark and Selection

**Qwen3 8B is selected for local ticket classification.** Qwen3 4B and 8B were compared on the 21-message held-out validation template, using the 23 labelled prompt-development messages as in-context examples. Both produced valid schema-constrained JSON for every message. Qwen3 8B achieved 81.0% sentiment agreement with manual labels, compared with 61.9% for Qwen3 4B, while taking 2.19 rather than 1.46 mean seconds per message. Its 28.6% exact-theme agreement modestly exceeded Qwen3 4B's 23.8%, although free-form theme wording makes exact matching a limited quality measure.

**This benchmark is sufficient for the demonstration, not for a production-quality claim.** The available personal hardware cannot run frontier open-weight models such as Qwen3-235B-A22B or Llama 4 Maverick locally, and no secure server is available for this work. The same local-inference pipeline and methodology are expected to produce satisfactory production results with access to that infrastructure.

A sentiment-only fine-tune would not address the equally important task of theme identification. **A useful specialist would require training on the project's ticket domain and theme taxonomy**, and no suitable documented industry-specific model was identified. The general Qwen3 instruction models are instead contextualized with the manually labelled examples.

Ollama is the **local model runtime**. The benchmark checks model availability, sends held-out messages only to the local endpoint, requests schema-constrained JSON with temperature zero and disabled reasoning, then records valid-output rate, exact label agreement, and seconds per message. The [official Ollama documentation](https://docs.ollama.com/) covers installation and runtime configuration.

### Text Profiling

**Text profiling preserves one customer-message sequence per ticket.** It verifies that every collection is list-like and contains strings, normalizes the Parquet-loaded arrays into Python lists, and checks their lengths against `customer_message_count`.

The source does not provide message-level timestamps. Later enrichment therefore preserves source-array order as message position, without treating that position as a chronological timestamp.

### Taxonomy Design

**Taxonomy design begins with a deterministic, balanced review sample.** It selects two tickets from each of the 15 observed `main_contact_reason` values and splits them into disjoint prompt-development and held-out validation sets. Each local CSV contains one row per unique normalized message, a stable message key, a duplicate-occurrence count, and blank `theme` and `sentiment` fields. Sentiment is selected as `positive`, `negative`, or `neutral`. The prompt-development labels define controlled themes and examples for the classifier prompt. The held-out labels provide the independent reference used to evaluate its output. **The validation template excludes `ticket_6MKG5_wc6_5GPaN0Kn` because it is predominantly quoted staff correspondence.** The resulting 23-message prompt-development and 21-message validation samples are sufficient for the demonstration. A production system would require substantially larger, stratified samples to represent themes and sentiments reliably.

**Template imports detect the CSV delimiter automatically.** This preserves manual edits made in spreadsheet software that exports semicolon-delimited files.

**Templates are generated locally before reviewed labels are applied.** The non-sensitive `reference_labels.csv` records only the 23 prompt-development and 21 validation labels. It applies them to templates sorted by their local message keys, with count and sequence validation before the local CSVs are written. The resulting label-application profile verifies complete coverage. This recreates labelled local templates without committing sensitive message text.

### Sampling

**Sampling creates a reproducible 1,000-ticket demonstration subset for local enrichment.** It excludes the 29 tickets used for manual prompt development and held-out validation, leaving a 9,971-ticket eligible pool, then allocates tickets proportionally across observed `main_contact_reason` values with a fixed seed. This keeps reviewed examples out of the model workload. The process preserves the full source dataset locally, writes the selected tickets to the ignored `enrichment/data/enrichment_sample.parquet` artifact, then reloads that artifact as the Classification input.

The sample profile compares source and sample counts by source label and ticket date. **This demonstrates coverage without claiming that the subset supports production-grade estimates for rare themes or outcome associations.**

**A production-grade system would define its exact theme categories and positive, negative, and neutral criteria with Marketing, CX, or Product teams.** Their input would align the labels with the decisions the organisation needs to make.

Source-system labels balance sample coverage but are excluded from the manual-review rows. This prevents the review process from reproducing the known noisy source taxonomy instead of deriving themes from message text.

### Assumptions and Failure Modes

| Assumption or failure mode | Pipeline behaviour |
| --- | --- |
| **The candidate models fit available memory.** | Qwen3 4B and 8B are benchmarked locally before one is selected for the demonstration workload. |
| **The Ollama service and both candidates are available locally.** | Benchmarking stops with the required `ollama pull` commands if either model is missing. |
| **Local inference protects ticket text.** | The classifier must call only the local Ollama endpoint, never a cloud inference provider. |
| **The held-out labels are representative.** | The small validation set supports a demonstration selection only, not a production-quality performance claim. |
| **Message collections align with source counts.** | Profiling validates each sequence against `customer_message_count` before any model labels are added. |
| **Source labels are suitable as ground truth.** | They are used only to balance the review sample. Manual labels are based on message text and context. |

## Next Steps

TBD
