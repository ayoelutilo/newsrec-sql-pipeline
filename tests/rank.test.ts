import { describe, expect, it } from "vitest";
import { rankArticles } from "../src/rank";
import { Article, RankingWeights, UserProfile } from "../src/types";

describe("rankArticles", () => {
  it("is stable and deterministic when scores tie", () => {
    const publishedAt = new Date("2026-03-07T10:00:00Z");

    const articles: Article[] = [
      {
        id: "article-b",
        title: "B",
        url: "https://example.com/b",
        publishedAt,
        topics: ["general"],
        embedding: [1, 0, 0, 0, 0, 0, 0, 0],
        popularity: 10,
        enrichment: {
          usedFallbackEmbedding: false,
          usedFallbackPopularity: false,
        },
      },
      {
        id: "article-a",
        title: "A",
        url: "https://example.com/a",
        publishedAt,
        topics: ["general"],
        embedding: [1, 0, 0, 0, 0, 0, 0, 0],
        popularity: 10,
        enrichment: {
          usedFallbackEmbedding: false,
          usedFallbackPopularity: false,
        },
      },
    ];

    const user: UserProfile = {
      userId: "u1",
      preferredTopics: [],
      queryEmbedding: null,
    };

    const weights: RankingWeights = {
      bias: 0,
      vector: 0,
      recency: 0,
      popularity: 0,
      topic: 0,
    };

    const first = rankArticles(articles, user, weights, new Date("2026-03-08T00:00:00Z"), 10).map(
      (item) => item.article.id,
    );
    const second = rankArticles(articles, user, weights, new Date("2026-03-08T00:00:00Z"), 10).map(
      (item) => item.article.id,
    );

    expect(first).toEqual(["article-a", "article-b"]);
    expect(second).toEqual(first);
  });
});
