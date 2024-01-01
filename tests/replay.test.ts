import { describe, expect, it } from "vitest";
import { fixtureInput } from "../src/fixtures";
import { DEFAULT_WEIGHTS } from "../src/learn";
import { runInMemoryPipeline } from "../src/pipeline";

describe("fixture replay", () => {
  it("replays fixture data end-to-end with deterministic ranking", () => {
    const now = new Date("2026-03-08T00:00:00Z");

    const run1 = runInMemoryPipeline(fixtureInput("u1"), { now });
    const run2 = runInMemoryPipeline(fixtureInput("u1"), { now });

    expect(run1.dedup.removedCount).toBe(1);
    expect(run1.weights.vector).toBeGreaterThan(DEFAULT_WEIGHTS.vector - 0.01);

    const articleA3 = run1.articles.find((article) => article.id === "a3");
    expect(articleA3?.enrichment.usedFallbackEmbedding).toBe(true);

    const ids1 = run1.ranking.map((row) => row.article.id);
    const ids2 = run2.ranking.map((row) => row.article.id);

    expect(ids1).toEqual(ids2);
    expect(ids1[0]).toBe("a3");
  });
});
