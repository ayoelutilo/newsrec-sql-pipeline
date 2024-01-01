export type InteractionType = "impression" | "click" | "like" | "dismiss";

export interface RawArticle {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  topics?: string[];
  embedding?: number[] | null;
  popularity?: number | null;
}

export interface Article {
  id: string;
  title: string;
  url: string;
  publishedAt: Date;
  topics: string[];
  embedding: number[] | null;
  popularity: number;
  enrichment: {
    usedFallbackEmbedding: boolean;
    usedFallbackPopularity: boolean;
  };
}

export interface RawInteraction {
  eventId?: string;
  userId: string;
  articleId: string;
  type: InteractionType;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface Interaction {
  eventId?: string;
  userId: string;
  articleId: string;
  type: InteractionType;
  timestamp: Date;
  metadata?: Record<string, string | number | boolean>;
}

export interface DedupResult {
  interactions: Interaction[];
  removedCount: number;
}

export interface UserProfile {
  userId: string;
  preferredTopics: string[];
  queryEmbedding: number[] | null;
}

export interface RankingWeights {
  bias: number;
  vector: number;
  recency: number;
  popularity: number;
  topic: number;
}

export interface FeatureVector {
  vector: number;
  recency: number;
  popularity: number;
  topic: number;
}

export interface TrainingExample {
  features: FeatureVector;
  label: 0 | 1;
}

export interface RankedArticle {
  article: Article;
  score: number;
  features: FeatureVector;
  reasons: string[];
}

export interface PipelineInput {
  userId: string;
  rawArticles: RawArticle[];
  rawInteractions: RawInteraction[];
  candidateArticleIds?: string[];
  limit?: number;
}

export interface LearnOptions {
  learningRate?: number;
  regularization?: number;
  epochs?: number;
}

export interface PipelineRunOptions {
  now?: Date;
  learn?: LearnOptions;
}

export interface PipelineResult {
  user: UserProfile;
  weights: RankingWeights;
  dedup: DedupResult;
  articles: Article[];
  ranking: RankedArticle[];
}
