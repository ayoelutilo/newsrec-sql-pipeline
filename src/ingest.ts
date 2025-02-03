import { Article, Interaction, RawArticle, RawInteraction } from "./types";

function parseTimestamp(value: string, field: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${field}: ${value}`);
  }
  return parsed;
}

function sanitizeTopics(topics: string[] | undefined): string[] {
  if (!topics || topics.length === 0) {
    return ["general"];
  }

  const normalized = new Set<string>();
  for (const topic of topics) {
    const cleaned = topic.trim().toLowerCase();
    if (cleaned.length > 0) {
      normalized.add(cleaned);
    }
  }

  return normalized.size > 0 ? [...normalized] : ["general"];
}

function sanitizeEmbedding(embedding: number[] | null | undefined): number[] | null {
  if (embedding === null || embedding === undefined) {
    return null;
  }

  const cleaned = embedding.filter((value) => Number.isFinite(value));
  return cleaned.length > 0 ? cleaned : null;
}

export function ingestArticles(rawArticles: RawArticle[]): Article[] {
  return rawArticles.map((raw) => ({
    id: raw.id,
    title: raw.title,
    url: raw.url,
    publishedAt: parseTimestamp(raw.publishedAt, "publishedAt"),
    topics: sanitizeTopics(raw.topics),
    embedding: sanitizeEmbedding(raw.embedding),
    popularity: raw.popularity === null || raw.popularity === undefined ? 0 : Math.max(0, raw.popularity),
    enrichment: {
      usedFallbackEmbedding: false,
      usedFallbackPopularity: raw.popularity === null || raw.popularity === undefined,
    },
  }));
}

export function ingestInteractions(rawInteractions: RawInteraction[]): Interaction[] {
  return rawInteractions
    .map((raw) => ({
      eventId: raw.eventId,
      userId: raw.userId,
      articleId: raw.articleId,
      type: raw.type,
      timestamp: parseTimestamp(raw.timestamp, "timestamp"),
      metadata: raw.metadata,
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

// Refinement.
