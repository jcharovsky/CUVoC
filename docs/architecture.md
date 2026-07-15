# Architecture

## Purpose

This document records the **implemented architecture, its consequential decisions, and its known limits**. It does not describe planned components.

## Phase 1 - Preparation

### System Overview

CUVoC contains a **local batch ingestion pipeline**. `scripts/data_ingestion.py` authenticates to the take-home API, retrieves metadata and all ticket pages, then saves local raw JSON artifacts under Git-ignored `data/raw/`.

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

### Assumptions and Failure Modes

| Assumption or failure mode | Pipeline behaviour |
| --- | --- |
| **The credential accesses both API endpoints.** | Authentication and client errors stop the run. |
| **The API can fail transiently.** | The script retries transient network and server failures before exiting non-zero. |
| **Responses match the required core schema.** | Missing metadata, invalid cursors, malformed ticket pages, and absent ticket IDs stop the run. |
| **Ticket IDs are stable.** | Duplicates are skipped and reported to standard error. |
| **A run can be interrupted.** | No partial target JSON file is written, but a failed pagination run retains no partial progress. |

## Next Steps