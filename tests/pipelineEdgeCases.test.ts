import { describe, expect, it } from "vitest";

import { runInMemoryPipeline } from "../src/pipeline";
import { PipelineInput } from "../src/types";

describe("pipeline edge cases", () => {
  it("deduplicates candidateArticleIds before ranking", () => {
    const input: PipelineInput = {
      userId: "u1",
      rawArticles: [
        {
          id: "a1",
          title: "Article 1",
          url: "https://example.com/a1",
          publishedAt: "2026-03-07T12:00:00Z",
          topics: ["general"],
          embedding: [1, 0, 0, 0, 0, 0, 0, 0],
          popularity: 10,
        },
        {
          id: "a2",
          title: "Article 2",
          url: "https://example.com/a2",
          publishedAt: "2026-03-07T11:00:00Z",
          topics: ["general"],
          embedding: [1, 0, 0, 0, 0, 0, 0, 0],
          popularity: 10,
        },
      ],
      rawInteractions: [],
      candidateArticleIds: ["a1", "a1", "a2", "a2"],
      limit: 10,
    };

    const result = runInMemoryPipeline(input, {
      now: new Date("2026-03-08T00:00:00Z"),
    });

    const rankedIds = result.ranking.map((row) => row.article.id);
    expect(rankedIds).toEqual(["a1", "a2"]);
  });

  it("preserves explicit zero popularity values without fallback replacement", () => {
    const input: PipelineInput = {
      userId: "u1",
      rawArticles: [
        {
          id: "a0",
          title: "Zero Popularity",
          url: "https://example.com/a0",
          publishedAt: "2026-03-07T12:00:00Z",
          topics: ["general"],
          embedding: [1, 0, 0, 0, 0, 0, 0, 0],
          popularity: 0,
        },
      ],
      rawInteractions: [],
      candidateArticleIds: ["a0"],
      limit: 1,
    };

    const result = runInMemoryPipeline(input, {
      now: new Date("2026-03-08T00:00:00Z"),
    });

    const article = result.articles.find((row) => row.id === "a0");
    expect(article).toBeDefined();
    expect(article?.enrichment.usedFallbackPopularity).toBe(false);
    expect(article?.popularity).toBe(0);
  });
});
