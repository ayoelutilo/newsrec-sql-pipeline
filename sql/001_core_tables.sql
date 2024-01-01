BEGIN;

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  topics TEXT[] NOT NULL DEFAULT '{}',
  embedding_array DOUBLE PRECISION[] NOT NULL,
  popularity DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (cardinality(embedding_array) > 0)
);

CREATE TABLE IF NOT EXISTS user_interactions (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT UNIQUE,
  user_id TEXT NOT NULL,
  article_id TEXT NOT NULL REFERENCES articles(id),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('impression', 'click', 'like', 'dismiss')),
  happened_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS model_weights (
  user_id TEXT PRIMARY KEY,
  bias DOUBLE PRECISION NOT NULL DEFAULT 0,
  vector_weight DOUBLE PRECISION NOT NULL DEFAULT 0.55,
  recency_weight DOUBLE PRECISION NOT NULL DEFAULT 0.2,
  popularity_weight DOUBLE PRECISION NOT NULL DEFAULT 0.15,
  topic_weight DOUBLE PRECISION NOT NULL DEFAULT 0.1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_topics_gin ON articles USING GIN (topics);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_time ON user_interactions (user_id, happened_at DESC);

CREATE OR REPLACE FUNCTION cosine_similarity(a DOUBLE PRECISION[], b DOUBLE PRECISION[])
RETURNS DOUBLE PRECISION
LANGUAGE SQL
IMMUTABLE
AS $$
  WITH shared_idx AS (
    SELECT i
    FROM generate_subscripts(a, 1) AS i
    WHERE i <= COALESCE(array_length(b, 1), 0)
  ),
  agg AS (
    SELECT
      (
        SELECT COALESCE(SUM(a[i] * b[i]), 0.0)
        FROM shared_idx
      ) AS dot,
      (
        SELECT COALESCE(SQRT(SUM(v * v)), 0.0)
        FROM unnest(a) AS t(v)
      ) AS norm_a,
      (
        SELECT COALESCE(SQRT(SUM(v * v)), 0.0)
        FROM unnest(b) AS t(v)
      ) AS norm_b
  )
  SELECT CASE
    WHEN norm_a = 0 OR norm_b = 0 THEN 0
    ELSE dot / (norm_a * norm_b)
  END
  FROM agg;
$$;

COMMIT;
