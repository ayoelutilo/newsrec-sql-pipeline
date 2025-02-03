# ADR 0001: Modular TypeScript + SQL fallback architecture

## Status

Accepted

## Context

The repository needs to demonstrate a full recommendation workflow that can run:

1. Locally in memory without any external dependency.
2. Against Postgres with optional pgvector support.

It also needs deterministic behavior for tests and replay.

## Decision

Use a module-per-stage pipeline in TypeScript:

- Ingest -> Dedup -> Enrich -> Learn -> Rank

And provide SQL migrations with two ranking paths:

- Array-based fallback scoring (`cosine_similarity` on `double precision[]`)
- Optional pgvector ranking when the extension is installed

## Consequences

Positive:

- Local simulation is simple and fast.
- SQL fallback remains valid on plain Postgres.
- pgvector can be enabled without changing application flow.
- Deterministic sorting (score, timestamp, id) avoids flaky tests.

Trade-offs:

- Fallback array similarity is slower than pgvector ANN indexes.
- The learner is intentionally lightweight and not a full model lifecycle.

- Changelog: minor updates.
