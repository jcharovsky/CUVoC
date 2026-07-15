# Architecture

## Purpose

This document records the **implemented architecture, its consequential decisions, and its known limits**. It does not describe planned components.

## Phase 1 - Preparation

### System Overview

The **Preparation process is encapsulated in `preparation/preparation.ipynb`**. The notebook loads local exports, presents the phase's code and reasoning in execution order, and remains output-free in version control to avoid sensitive data leakage.

CUVoC contains a **local batch ingestion pipeline**. `preparation/modules/ingestion.py` authenticates to the take-home API, retrieves metadata and all ticket pages, then saves local raw JSON artifacts under Git-ignored `preparation/data/` to prevent confidential data exposure.

### Data Flow

1. The script reads `TAKEHOME_API_KEY` from the process environment or local `.env` file, then retrieves and validates API metadata.
2. It retrieves ticket pages until `next_cursor` is `null`, with optional date filters on the initial request.
3. It validates ticket IDs, skips duplicates, and retries transient request failures.
4. It atomically writes `metadata.json` and `tickets.json` after the complete export succeeds.

### Design Decisions

| Decision | Rationale |
| --- | --- |
| **Standard-library implementation** | The export runs without third-party runtime dependencies. |
| **Complete export before persistence** | A failed pagination run cannot be mistaken for a complete dataset. |
| **Separate raw JSON artifacts** | API metadata remains available with the exported tickets. |
| **Validation, retries, and deduplication** | Incompatible responses fail visibly, while transient failures and duplicate IDs are handled safely. |
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
| **Notebook output can expose raw data.** | The Git filter removes output before staging, while the pre-commit check verifies the staged notebook content. |

## Next Steps
