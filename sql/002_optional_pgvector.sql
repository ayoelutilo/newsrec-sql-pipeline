BEGIN;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
  WHEN undefined_file THEN
    RAISE NOTICE 'pgvector extension is not installed; continuing with array-only fallback scoring.';
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    ALTER TABLE articles ADD COLUMN IF NOT EXISTS embedding_vec vector(8);

    -- Keep fallback path as source of truth; application can backfill embedding_vec when extension is present.
    CREATE INDEX IF NOT EXISTS idx_articles_embedding_vec
      ON articles
      USING ivfflat (embedding_vec vector_cosine_ops)
      WITH (lists = 64);
  END IF;
END;
$$;

COMMIT;
