/**
 * Script to generate embeddings for documents
 *
 * Run this script to pre-compute embeddings for your CV and other documents.
 * This enables the hybrid mode (faster, no client-side model loading).
 *
 * Usage:
 *   node scripts/generate-embeddings.js
 *
 * Or use the Python version for better performance:
 *   python scripts/generate_embeddings.py
 */

import { pipeline } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const OUTPUT_FILE = path.join(__dirname, '../data/embeddings.json');
const DOCUMENTS_DIR = path.join(__dirname, '../data/documents');

// Documents to process
const documents = [
  {
    file: 'cv.txt', // Your CV as plain text
    metadata: {
      type: 'cv',
      title: 'Ryan Hill - CV',
    },
  },
  {
    file: 'about.txt',
    metadata: {
      type: 'about',
      title: 'About Ryan',
    },
  },
  // Add more documents here
];

/**
 * Chunk text into smaller pieces
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
 * Generate embeddings for all documents
 */
async function generateEmbeddings() {
  console.log('Loading embedding model...');
  const extractor = await pipeline('feature-extraction', EMBEDDING_MODEL);

  const allEmbeddings = [];

  for (const doc of documents) {
    const filePath = path.join(DOCUMENTS_DIR, doc.file);

    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }

    console.log(`Processing ${doc.file}...`);
    const text = fs.readFileSync(filePath, 'utf-8');
    const chunks = chunkText(text);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(
        `  Generating embedding for chunk ${i + 1}/${chunks.length}...`,
      );

      const output = await extractor(chunk, {
        pooling: 'mean',
        normalize: true,
      });

      const embedding = Array.from(output.data);

      allEmbeddings.push({
        id: `${doc.metadata.type}_${i}`,
        text: chunk,
        embedding,
        metadata: {
          ...doc.metadata,
          chunkIndex: i,
          totalChunks: chunks.length,
          sourceFile: doc.file,
        },
      });
    }
  }

  // Save embeddings
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify({ embeddings: allEmbeddings }, null, 2),
  );

  console.log(`\n✅ Generated ${allEmbeddings.length} embeddings`);
  console.log(`Saved to: ${OUTPUT_FILE}`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateEmbeddings().catch(console.error);
}
