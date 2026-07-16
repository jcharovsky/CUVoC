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

The **Enrichment notebook has been initialized at `enrichment/enrichment.ipynb`**. It currently provides the documented notebook structure and shared library imports only; it does not yet load data, select a local model, or generate labels.

## Next Steps

TBD
