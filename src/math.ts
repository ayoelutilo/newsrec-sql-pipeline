const EPSILON = 1e-9;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function sigmoid(x: number): number {
  if (x >= 0) {
    const z = Math.exp(-x);
    return 1 / (1 + z);
  }
  const z = Math.exp(x);
  return z / (1 + z);
}

export function dotProduct(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let result = 0;
  for (let i = 0; i < n; i += 1) {
    result += a[i] * b[i];
  }
  return result;
}

export function vectorNorm(v: number[]): number {
  let sum = 0;
  for (let i = 0; i < v.length; i += 1) {
    sum += v[i] * v[i];
  }
  return Math.sqrt(sum);
}

export function normalizeVector(v: number[], dimension?: number): number[] {
  const target = dimension === undefined ? [...v] : Array.from({ length: dimension }, (_, idx) => v[idx] ?? 0);
  const norm = vectorNorm(target);
  if (norm <= EPSILON) {
    return target.map(() => 0);
  }
  return target.map((value) => value / norm);
}

export function averageVectors(vectors: number[][], dimension?: number): number[] | null {
  if (vectors.length === 0) {
    return null;
  }

  const maxDim = dimension ?? Math.max(...vectors.map((vec) => vec.length));
  const accumulator = new Array(maxDim).fill(0);

  for (const vector of vectors) {
    for (let i = 0; i < maxDim; i += 1) {
      accumulator[i] += vector[i] ?? 0;
    }
  }

  for (let i = 0; i < accumulator.length; i += 1) {
    accumulator[i] /= vectors.length;
  }

  return normalizeVector(accumulator);
}

export function cosineSimilarity(a: number[] | null, b: number[] | null): number {
  if (a === null || b === null || a.length === 0 || b.length === 0) {
    return 0;
  }
  const dot = dotProduct(a, b);
  const denom = vectorNorm(a) * vectorNorm(b);
  if (denom <= EPSILON) {
    return 0;
  }
  return dot / denom;
}
