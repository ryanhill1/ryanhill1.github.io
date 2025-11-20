/**
 * Vector Database for CLI RAG (Retrieval-Augmented Generation)
 *
 * This module provides vector search capabilities for intelligent responses
 * based on uploaded documents (CV, etc.)
 *
 * Options:
 * 1. Client-side: Uses transformers.js (runs in browser, no server needed)
 * 2. Server-side: Uses external API (Pinecone, Supabase, etc.)
 * 3. Hybrid: Pre-computed embeddings stored as JSON
 */

// Configuration
const VECTOR_DB_CONFIG = {
  // Choose implementation: 'client', 'server', or 'hybrid'
  mode: 'hybrid', // Start with hybrid (pre-computed embeddings)

  // For client-side: embedding model
  embeddingModel: 'Xenova/all-MiniLM-L6-v2', // Lightweight, fast model

  // For server-side: API endpoints
  serverEndpoint: '/api/vector-search',

  // Similarity threshold
  similarityThreshold: 0.5,

  // Max results to return
  maxResults: 3,
};

// In-memory vector store (for client-side and hybrid modes)
let vectorStore = [];
let embeddingPipeline = null;

/**
 * Initialize the vector database
 */
async function initVectorDB() {
  if (VECTOR_DB_CONFIG.mode === 'client') {
    // Load transformers.js for client-side embeddings
    try {
      const { pipeline } = await import(
        'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2'
      );
      embeddingPipeline = await pipeline(
        'feature-extraction',
        VECTOR_DB_CONFIG.embeddingModel,
      );
      console.log('Vector DB initialized (client-side mode)');
    } catch (error) {
      console.error('Failed to load transformers.js:', error);
      console.log('Falling back to hybrid mode');
      VECTOR_DB_CONFIG.mode = 'hybrid';
    }
  }

  // Load pre-computed embeddings if in hybrid mode
  if (VECTOR_DB_CONFIG.mode === 'hybrid') {
    await loadPrecomputedEmbeddings();
  }
}

/**
 * Load pre-computed embeddings from JSON file
 */
async function loadPrecomputedEmbeddings() {
  try {
    const response = await fetch('/data/embeddings.json');
    if (response.ok) {
      const data = await response.json();
      vectorStore = data.embeddings || [];
      console.log(`Loaded ${vectorStore.length} pre-computed embeddings`);
    } else {
      console.warn(
        'No pre-computed embeddings found. Run embedding generation script first.',
      );
      // Initialize with empty store - can be populated via upload
      vectorStore = [];
    }
  } catch (error) {
    console.warn('Could not load embeddings:', error);
    vectorStore = [];
  }
}

/**
 * Generate embedding for text (client-side)
 */
async function generateEmbedding(text) {
  if (VECTOR_DB_CONFIG.mode === 'client' && embeddingPipeline) {
    const output = await embeddingPipeline(text, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(output.data);
  }

  // For hybrid/server mode, embeddings should be pre-computed
  throw new Error('Embedding generation not available in current mode');
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search for similar documents
 */
async function searchSimilar(query, options = {}) {
  const threshold = options.threshold || VECTOR_DB_CONFIG.similarityThreshold;
  const maxResults = options.maxResults || VECTOR_DB_CONFIG.maxResults;

  if (VECTOR_DB_CONFIG.mode === 'server') {
    // Server-side search
    try {
      const response = await fetch(VECTOR_DB_CONFIG.serverEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, threshold, maxResults }),
      });
      const results = await response.json();
      return results;
    } catch (error) {
      console.error('Server search failed:', error);
      return [];
    }
  }

  // Client-side or hybrid search
  let queryEmbedding;

  if (VECTOR_DB_CONFIG.mode === 'client' && embeddingPipeline) {
    // Generate embedding on-the-fly
    queryEmbedding = await generateEmbedding(query);
  } else if (VECTOR_DB_CONFIG.mode === 'hybrid') {
    // In hybrid mode, try to load transformers.js for query embeddings
    // If not available, fall back to keyword search
    if (!embeddingPipeline) {
      try {
        const { pipeline } = await import(
          'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2'
        );
        embeddingPipeline = await pipeline(
          'feature-extraction',
          VECTOR_DB_CONFIG.embeddingModel,
        );
      } catch (error) {
        console.warn(
          'Could not load transformers.js, using keyword search:',
          error,
        );
        return keywordSearch(query, maxResults);
      }
    }
    queryEmbedding = await generateEmbedding(query);
  } else {
    // Fallback to keyword search
    return keywordSearch(query, maxResults);
  }

  // Calculate similarities
  const results = vectorStore
    .map((doc) => ({
      ...doc,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding),
    }))
    .filter((doc) => doc.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);

  return results;
}

/**
 * Keyword-based search (fallback for hybrid mode without query embeddings)
 */
function keywordSearch(query, maxResults) {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2); // Filter out short words

  if (queryWords.length === 0) {
    return [];
  }

  const results = vectorStore
    .map((doc) => {
      const textLower = doc.text.toLowerCase();
      let score = 0;
      let exactMatches = 0;

      // Count matching words with weighting
      queryWords.forEach((word) => {
        // Exact word match (higher weight)
        const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
        if (wordRegex.test(textLower)) {
          score += 2;
          exactMatches++;
        } else if (textLower.includes(word)) {
          score += 1;
        }
      });

      // Normalize by query length and boost exact matches
      score =
        (score / queryWords.length) * (1 + exactMatches / queryWords.length);

      return { ...doc, similarity: Math.min(score, 1.0) };
    })
    .filter((doc) => doc.similarity > 0.3) // Higher threshold for keyword search
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);

  return results;
}

/**
 * Add document to vector store
 */
async function addDocument(text, metadata = {}) {
  let embedding;

  if (VECTOR_DB_CONFIG.mode === 'client' && embeddingPipeline) {
    embedding = await generateEmbedding(text);
  } else {
    // In hybrid/server mode, need to generate embeddings server-side
    // or use a pre-computation script
    throw new Error(
      'Document addition requires client-side mode or server API',
    );
  }

  const doc = {
    id: Date.now().toString(),
    text,
    embedding,
    metadata: {
      ...metadata,
      addedAt: new Date().toISOString(),
    },
  };

  vectorStore.push(doc);
  return doc.id;
}

/**
 * Chunk text into smaller pieces for better retrieval
 */
function chunkText(text, chunkSize = 500, overlap = 50) {
  const words = text.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

/**
 * Process and index a document (with chunking)
 */
async function indexDocument(text, metadata = {}) {
  const chunks = chunkText(text);
  const docIds = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkMetadata = {
      ...metadata,
      chunkIndex: i,
      totalChunks: chunks.length,
    };
    const id = await addDocument(chunks[i], chunkMetadata);
    docIds.push(id);
  }

  return docIds;
}

// Export for use in CLI
if (typeof window !== 'undefined') {
  window.vectorDB = {
    init: initVectorDB,
    search: searchSimilar,
    addDocument,
    indexDocument,
    chunkText,
  };
}
