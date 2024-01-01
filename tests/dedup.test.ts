import { describe, expect, it } from "vitest";
import { dedupInteractions } from "../src/dedup";
import { ingestInteractions } from "../src/ingest";
import { RawInteraction } from "../src/types";

describe("dedupInteractions", () => {
  it("removes exact duplicates by event ID and preserves first occurrence", () => {
    const raw: RawInteraction[] = [
      {
        eventId: "same",
        userId: "u1",
        articleId: "a1",
        type: "impression",
        timestamp: "2026-03-07T01:00:00Z",
      },
      {
        eventId: "same",
        userId: "u1",
        articleId: "a1",
        type: "impression",
        timestamp: "2026-03-07T01:00:00Z",
      },
      {
        userId: "u1",
        articleId: "a1",
        type: "click",
        timestamp: "2026-03-07T01:01:00Z",
      },
      {
        userId: "u1",
        articleId: "a1",
        type: "click",
        timestamp: "2026-03-07T01:01:00Z",
      },
    ];

    const deduped = dedupInteractions(ingestInteractions(raw));

    expect(deduped.removedCount).toBe(2);
    expect(deduped.interactions).toHaveLength(2);
    expect(deduped.interactions[0].eventId).toBe("same");
    expect(deduped.interactions[1].type).toBe("click");
  });
});
