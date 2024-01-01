DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION rank_candidates_pgvector(
        p_user_id TEXT,
        p_query_embedding vector(8),
        p_preferred_topics TEXT[] DEFAULT '{}',
        p_limit INTEGER DEFAULT 10
      )
      RETURNS TABLE (
        article_id TEXT,
        score DOUBLE PRECISION,
        vector_score DOUBLE PRECISION,
        recency_score DOUBLE PRECISION,
        popularity_score DOUBLE PRECISION,
        topic_score DOUBLE PRECISION
      )
      LANGUAGE SQL
      STABLE
      AS $inner$
        WITH w AS (
          SELECT
            COALESCE(m.bias, 0.0) AS bias,
            COALESCE(m.vector_weight, 0.55) AS vector_weight,
            COALESCE(m.recency_weight, 0.2) AS recency_weight,
            COALESCE(m.popularity_weight, 0.15) AS popularity_weight,
            COALESCE(m.topic_weight, 0.1) AS topic_weight
          FROM (SELECT 1) AS seed
          LEFT JOIN model_weights m ON m.user_id = p_user_id
        ),
        scored AS (
          SELECT
            a.id AS article_id,
            a.published_at AS published_at,
            CASE
              WHEN p_query_embedding IS NULL OR a.embedding_vec IS NULL THEN 0
              ELSE 1 - (a.embedding_vec <=> p_query_embedding)
            END AS vector_score,
            EXP(-GREATEST(EXTRACT(EPOCH FROM (NOW() - a.published_at)) / 3600.0, 0) / 72.0) AS recency_score,
            LEAST(1.0, LN(1 + a.popularity) / LN(1000)) AS popularity_score,
            CASE
              WHEN COALESCE(array_length(p_preferred_topics, 1), 0) = 0 THEN 0
              ELSE (
                SELECT COALESCE(COUNT(*), 0)::DOUBLE PRECISION / array_length(p_preferred_topics, 1)
                FROM unnest(a.topics) AS t(topic)
                WHERE topic = ANY(p_preferred_topics)
              )
            END AS topic_score
          FROM articles a
        )
        SELECT
          s.article_id,
          w.bias
            + w.vector_weight * s.vector_score
            + w.recency_weight * s.recency_score
            + w.popularity_weight * s.popularity_score
            + w.topic_weight * s.topic_score AS score,
          s.vector_score,
          s.recency_score,
          s.popularity_score,
          s.topic_score
        FROM scored s
        CROSS JOIN w
        ORDER BY score DESC, s.published_at DESC, article_id ASC
        LIMIT p_limit;
      $inner$;
    $fn$;
  END IF;
END;
$$;
