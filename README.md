# newsrec-sql-pipeline

A compact TypeScript news recommendation pipeline with two execution modes:

Status: source-only reference implementation (`package.json` is private).

- **In-memory simulation** (no DB required)
- **Postgres SQL migrations/queries** for production-style storage and ranking

## Modules

- `src/ingest.ts`: Normalizes raw article and interaction input.
- `src/dedup.ts`: Idempotent event deduplication.
- `src/enrich.ts`: Embedding/popularity fallback enrichment.
- `src/learn.ts`: Online weight learning from user feedback.
- `src/rank.ts`: Feature scoring and deterministic ranking.
- `src/pipeline.ts`: End-to-end orchestration.
- `src/simulate.ts`: CLI simulation using fixture data.

## Quick start

```bash
npm install
npm run test
npm run simulate
```

Example simulation output includes dedup stats, learned weights, and top ranked articles.

## SQL

SQL files are under `sql/`:

- `001_core_tables.sql`: Core tables, indexes, and fallback cosine function.
- `002_optional_pgvector.sql`: Optional pgvector extension + vector column/index.
- `003_rank_candidates.sql`: Ranking function using array-based fallback scoring.
- `004_rank_candidates_pgvector.sql`: Optional pgvector-accelerated ranking function.

This design keeps ranking functional even when pgvector is unavailable.

## Fixtures and replay

Fixtures are under `data/fixtures/`:

- `articles.json`
- `interactions.json`
- `candidates.json`

Replay coverage is in `tests/replay.test.ts` and executes the full flow.

## Architecture decision record

See `docs/adr/0001-architecture.md`.

- Changelog: minor updates.
