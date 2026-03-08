import { fixtureInput } from "./fixtures";
import { runInMemoryPipeline } from "./pipeline";

const userId = process.argv[2] ?? "u1";
const now = new Date("2026-03-08T00:00:00Z");

const result = runInMemoryPipeline(fixtureInput(userId), {
  now,
  learn: {
    learningRate: 0.11,
    regularization: 0.01,
    epochs: 10,
  },
});

console.log(`newsrec-sql-pipeline simulation`);
console.log(`user: ${result.user.userId}`);
console.log(`dedup removed: ${result.dedup.removedCount}`);
console.log(`preferred topics: ${result.user.preferredTopics.join(", ") || "(none)"}`);
console.log(`weights: ${JSON.stringify(result.weights)}`);
console.log("top recommendations:");

for (const [index, row] of result.ranking.entries()) {
  console.log(
    `${index + 1}. ${row.article.id} | score=${row.score.toFixed(4)} | reasons=${row.reasons.join(",") || "none"}`,
  );
}
