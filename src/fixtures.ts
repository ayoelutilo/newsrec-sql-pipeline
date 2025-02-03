import fixtureArticles from "../data/fixtures/articles.json";
import fixtureInteractions from "../data/fixtures/interactions.json";
import fixtureCandidates from "../data/fixtures/candidates.json";
import { PipelineInput, RawArticle, RawInteraction } from "./types";

export function fixtureInput(userId = "u1"): PipelineInput {
  return {
    userId,
    rawArticles: fixtureArticles as RawArticle[],
    rawInteractions: fixtureInteractions as RawInteraction[],
    candidateArticleIds: fixtureCandidates as string[],
    limit: 5,
  };
}

// Refinement.
