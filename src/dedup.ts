import { DedupResult, Interaction } from "./types";

function dedupKey(interaction: Interaction): string {
  if (interaction.eventId && interaction.eventId.trim().length > 0) {
    return `event:${interaction.eventId.trim()}`;
  }

  // Millisecond timestamp is used so repeated replay batches are idempotent.
  return [
    interaction.userId,
    interaction.articleId,
    interaction.type,
    String(interaction.timestamp.getTime()),
  ].join("|");
}

export function dedupInteractions(interactions: Interaction[]): DedupResult {
  const seen = new Set<string>();
  const unique: Interaction[] = [];
  let removedCount = 0;

  for (const interaction of interactions) {
    const key = dedupKey(interaction);
    if (seen.has(key)) {
      removedCount += 1;
      continue;
    }
    seen.add(key);
    unique.push(interaction);
  }

  return {
    interactions: unique,
    removedCount,
  };
}
