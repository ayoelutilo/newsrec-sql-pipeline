import { FeatureVector, LearnOptions, RankingWeights, TrainingExample } from "./types";
import { sigmoid } from "./math";

export const DEFAULT_WEIGHTS: RankingWeights = Object.freeze({
  bias: 0,
  vector: 0.55,
  recency: 0.2,
  popularity: 0.15,
  topic: 0.1,
});

export function scoreFeatures(weights: RankingWeights, features: FeatureVector): number {
  return (
    weights.bias +
    weights.vector * features.vector +
    weights.recency * features.recency +
    weights.popularity * features.popularity +
    weights.topic * features.topic
  );
}

export function learnWeights(
  initialWeights: RankingWeights,
  examples: TrainingExample[],
  options: LearnOptions = {},
): RankingWeights {
  const learningRate = options.learningRate ?? 0.12;
  const regularization = options.regularization ?? 0.015;
  const epochs = options.epochs ?? 8;

  const learned: RankingWeights = { ...initialWeights };

  for (let epoch = 0; epoch < epochs; epoch += 1) {
    for (const example of examples) {
      const prediction = sigmoid(scoreFeatures(learned, example.features));
      const error = example.label - prediction;

      learned.bias += learningRate * (error - regularization * learned.bias);
      learned.vector += learningRate * (error * example.features.vector - regularization * learned.vector);
      learned.recency += learningRate * (error * example.features.recency - regularization * learned.recency);
      learned.popularity += learningRate * (error * example.features.popularity - regularization * learned.popularity);
      learned.topic += learningRate * (error * example.features.topic - regularization * learned.topic);
    }
  }

  return learned;
}

// Refinement.
