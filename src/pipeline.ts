import { averageVectors } from "./math";
import { dedupInteractions } from "./dedup";
import { enrichArticles } from "./enrich";
import { ingestArticles, ingestInteractions } from "./ingest";
import { DEFAULT_WEIGHTS, learnWeights } from "./learn";
import { buildFeatureVector, rankArticles } from "./rank";
import {
  Article,
  Interaction,
  PipelineInput,
  PipelineResult,
  PipelineRunOptions,
  TrainingExample,
  UserProfile,
} from "./types";

function buildUserProfile(userId: string, interactions: Interaction[], articleMap: Map<string, Article>): UserProfile {
  const topicCounts = new Map<string, number>();
  const positiveEmbeddings: number[][] = [];

  for (const interaction of interactions) {
    if (interaction.userId !== userId) {
      continue;
    }

    if (interaction.type !== "click" && interaction.type !== "like") {
      continue;
    }

    const article = articleMap.get(interaction.articleId);
    if (!article) {
      continue;
    }

    for (const topic of article.topics) {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
    }

    if (article.embedding !== null) {
      positiveEmbeddings.push(article.embedding);
    }
  }

  const preferredTopics = [...topicCounts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }
      return a[0].localeCompare(b[0]);
    })
    .map(([topic]) => topic)
    .slice(0, 6);

  const queryEmbedding = averageVectors(positiveEmbeddings);

  return {
    userId,
    preferredTopics,
    queryEmbedding,
  };
}

function toTrainingExamples(
  interactions: Interaction[],
  user: UserProfile,
  articleMap: Map<string, Article>,
  now: Date,
): TrainingExample[] {
  const examples: TrainingExample[] = [];

  for (const interaction of interactions) {
    if (interaction.userId !== user.userId) {
      continue;
    }

    const article = articleMap.get(interaction.articleId);
    if (!article) {
      continue;
    }

    let label: 0 | 1;
    if (interaction.type === "click" || interaction.type === "like") {
      label = 1;
    } else if (interaction.type === "dismiss") {
      label = 0;
    } else {
      // Impressions act as weak negative examples in this local simulation.
      label = 0;
    }

    examples.push({
      features: buildFeatureVector(article, user, now),
      label,
    });
  }

  return examples;
}

export function runInMemoryPipeline(input: PipelineInput, options: PipelineRunOptions = {}): PipelineResult {
  const now = options.now ?? new Date();

  const ingestedArticles = ingestArticles(input.rawArticles);
  const ingestedInteractions = ingestInteractions(input.rawInteractions);
  const dedup = dedupInteractions(ingestedInteractions);
  const articles = enrichArticles(ingestedArticles, now);

  const articleMap = new Map(articles.map((article) => [article.id, article]));
  const user = buildUserProfile(input.userId, dedup.interactions, articleMap);

  const examples = toTrainingExamples(dedup.interactions, user, articleMap, now);
  const weights = examples.length > 0 ? learnWeights({ ...DEFAULT_WEIGHTS }, examples, options.learn) : { ...DEFAULT_WEIGHTS };

  const candidateArticles =
    input.candidateArticleIds && input.candidateArticleIds.length > 0
      ? Array.from(new Set(input.candidateArticleIds))
          .map((id) => articleMap.get(id))
          .filter((article): article is Article => article !== undefined)
      : articles;

  const ranking = rankArticles(candidateArticles, user, weights, now, input.limit ?? 10);

  return {
    user,
    weights,
    dedup,
    articles,
    ranking,
  };
}

// Refinement.
