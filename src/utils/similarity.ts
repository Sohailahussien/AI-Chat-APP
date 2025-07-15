/**
 * Calculates term frequency (TF) for a word in a document
 */
function termFrequency(term: string, doc: string): number {
  const words = doc.split(/\s+/);
  const termCount = words.filter(word => word === term).length;
  return termCount / words.length;
}

/**
 * Creates a vector of term frequencies for common terms between two texts
 */
function createVector(text1: string, text2: string): { vector1: number[], vector2: number[] } {
  // Get unique words from both texts
  const words1 = Array.from(new Set(text1.split(/\s+/)));
  const words2 = Array.from(new Set(text2.split(/\s+/)));
  const commonWords = words1.filter(word => words2.includes(word));

  // Create vectors based on term frequency
  const vector1 = commonWords.map(term => termFrequency(term, text1));
  const vector2 = commonWords.map(term => termFrequency(term, text2));

  return { vector1, vector2 };
}

/**
 * Calculates cosine similarity between two vectors
 */
function vectorCosineSimilarity(vector1: number[], vector2: number[]): number {
  if (vector1.length === 0 || vector2.length === 0) return 0;

  const dotProduct = vector1.reduce((sum, a, i) => sum + a * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, a) => sum + a * a, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, a) => sum + a * a, 0));

  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Calculates cosine similarity between two texts
 */
export function cosineSimilarity(text1: string, text2: string): number {
  const { vector1, vector2 } = createVector(text1, text2);
  return vectorCosineSimilarity(vector1, vector2);
} 