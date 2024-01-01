import { clamp, cosineSimilarity } from "./math";
import { scoreFeatures } from "./learn";
import { Article, FeatureVector, RankedArticle, RankingWeights, UserProfile } from "./types";

function topicOverlap(preferred: string[], articleTopics: string[]): number {
  if (preferred.length === 0 || articleTopics.length === 0) {
    return 0;
  }

  const preferredSet = new Set(preferred);
  let overlap = 0;
  for (const topic of articleTopics) {
    if (preferredSet.has(topic)) {
      overlap += 1;
    }
  }

  return overlap / preferredSet.size;
}

export function buildFeatureVector(article: Article, user: UserProfile, now = new Date()): FeatureVector {
  const vector = cosineSimilarity(user.queryEmbedding, article.embedding);

  const ageHours = Math.max(0, (now.getTime() - article.publishedAt.getTime()) / (1000 * 60 * 60));
  const recency = Math.exp(-ageHours / 72);
  const popularity = clamp(Math.log10(article.popularity + 1) / 3, 0, 1);
  const topic = topicOverlap(user.preferredTopics, article.topics);

  return {
    vector,
    recency,
    popularity,
    topic,
  };
}

export function rankArticles(
  articles: Article[],
  user: UserProfile,
  weights: RankingWeights,
  now = new Date(),
  limit = 10,
): RankedArticle[] {
  const scored = articles.map((article) => {
    const features = buildFeatureVector(article, user, now);
    const score = scoreFeatures(weights, features);

    const reasons: string[] = [];
    if (features.topic > 0) {
      reasons.push("topic-match");
    }
    if (features.vector > 0.35) {
      reasons.push("semantic-similarity");
    }
    if (article.enrichment.usedFallbackEmbedding) {
      reasons.push("fallback-embedding");
    }

    return {
      article,
      score,
      features,
      reasons,
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    const publishedDelta = b.article.publishedAt.getTime() - a.article.publishedAt.getTime();
    if (publishedDelta !== 0) {
      return publishedDelta;
    }

    return a.article.id.localeCompare(b.article.id);
  });

  return scored.slice(0, limit);
}
