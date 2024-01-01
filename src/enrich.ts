import { normalizeVector } from "./math";
import { Article } from "./types";

export const EMBEDDING_DIMENSION = 8;

function seededValue(seed: string, position: number): number {
  let hash = 2166136261;
  const data = `${seed}#${position}`;
  for (let i = 0; i < data.length; i += 1) {
    hash ^= data.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const normalized = (hash >>> 0) / 0xffffffff;
  return normalized * 2 - 1;
}

export function fallbackEmbedding(seed: string): number[] {
  const values = Array.from({ length: EMBEDDING_DIMENSION }, (_, idx) => seededValue(seed, idx));
  return normalizeVector(values);
}

export function enrichArticles(articles: Article[], now = new Date()): Article[] {
  return articles.map((article) => {
    const hasEmbedding = article.embedding !== null && article.embedding.length > 0;
    const embedding = hasEmbedding
      ? normalizeVector(article.embedding ?? [], EMBEDDING_DIMENSION)
      : fallbackEmbedding(`${article.title}|${article.topics.join(",")}`);

    const hasPopularity = !article.enrichment.usedFallbackPopularity;
    const ageHours = Math.max(0, (now.getTime() - article.publishedAt.getTime()) / (1000 * 60 * 60));
    const fallbackPopularity = Math.max(1, 120 - Math.min(96, ageHours));

    return {
      ...article,
      embedding,
      popularity: hasPopularity ? article.popularity : fallbackPopularity,
      enrichment: {
        usedFallbackEmbedding: !hasEmbedding,
        usedFallbackPopularity: !hasPopularity,
      },
    };
  });
}
