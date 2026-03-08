import { describe, expect, it } from "vitest";
import { DEFAULT_WEIGHTS, learnWeights, scoreFeatures } from "../src/learn";

describe("learnWeights", () => {
  it("updates weights so positive examples score higher after training", () => {
    const positive = {
      features: {
        vector: 0.95,
        recency: 0.7,
        popularity: 0.3,
        topic: 1,
      },
      label: 1 as const,
    };

    const negative = {
      features: {
        vector: 0.05,
        recency: 0.8,
        popularity: 1,
        topic: 0,
      },
      label: 0 as const,
    };

    const beforePositive = scoreFeatures(DEFAULT_WEIGHTS, positive.features);
    const beforeNegative = scoreFeatures(DEFAULT_WEIGHTS, negative.features);

    const learned = learnWeights(
      { ...DEFAULT_WEIGHTS },
      [positive, negative, positive, positive, negative],
      { learningRate: 0.12, regularization: 0.01, epochs: 12 },
    );

    const afterPositive = scoreFeatures(learned, positive.features);
    const afterNegative = scoreFeatures(learned, negative.features);

    expect(learned.vector).toBeGreaterThan(DEFAULT_WEIGHTS.vector);
    expect(afterPositive).toBeGreaterThan(beforePositive);
    expect(afterPositive - afterNegative).toBeGreaterThan(beforePositive - beforeNegative);
  });
});
