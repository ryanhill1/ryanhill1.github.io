# Vector Database Setup Guide

This guide explains how to set up the vector database for intelligent CLI responses based on your CV and other documents.

## Overview

The vector database enables the CLI to answer questions intelligently by:
1. Converting your documents (CV, etc.) into vector embeddings
2. Storing these embeddings
3. Finding relevant information when users ask questions
4. Generating context-aware responses

## Three Implementation Modes

### 1. Hybrid Mode (Recommended - Default)
- **Pros**: Fast, no client-side model loading, works on static sites
- **Cons**: Requires pre-computing embeddings
- **Best for**: Production static sites (GitHub Pages)

### 2. Client-Side Mode
- **Pros**: No server needed, can add documents dynamically
- **Cons**: Slower initial load, larger bundle size
- **Best for**: Development, dynamic document uploads

### 3. Server-Side Mode
- **Pros**: Most powerful, can use better models
- **Cons**: Requires backend infrastructure
- **Best for**: Full-stack applications

## Quick Start (Hybrid Mode)

### Step 1: Prepare Your Documents

1. Create `data/documents/` directory:
   ```bash
   mkdir -p data/documents
   ```

2. Add your CV as plain text:
   ```bash
   # Convert your CV to plain text and save as:
   data/documents/cv.txt
   ```

3. Optionally add other documents (about.txt, projects.txt, etc.)

### Step 2: Generate Embeddings

**Option A: Python (Recommended - Faster)**
```bash
# Install dependencies
pip install sentence-transformers

# Generate embeddings
python scripts/generate_embeddings.py
```

**Option B: Node.js**
```bash
# Install dependencies
npm install @xenova/transformers

# Generate embeddings
node scripts/generate-embeddings.js
```

This creates `data/embeddings.json` with pre-computed embeddings.

### Step 3: Update Document List

Edit `scripts/generate_embeddings.py` (or `.js`) to include all your documents:

```python
DOCUMENTS = [
    {
        'file': 'cv.txt',
        'metadata': {
            'type': 'cv',
            'title': 'Ryan Hill - CV',
        },
    },
    {
        'file': 'about.txt',
        'metadata': {
            'type': 'about',
            'title': 'About Ryan',
        },
    },
    # Add more documents...
]
```

### Step 4: Test

1. Start your dev server: `npm run dev`
2. Navigate to `/cli.html`
3. Ask questions like:
   - "What is Ryan's experience?"
   - "Tell me about Ryan's education"
   - "What skills does Ryan have?"

## Switching Modes

Edit `components/vector-db.js`:

```javascript
const VECTOR_DB_CONFIG = {
  mode: 'hybrid', // Change to 'client' or 'server'
  // ...
};
```

## Client-Side Mode Setup

1. Change mode to `'client'` in `vector-db.js`
2. The transformers.js library will load automatically
3. Documents can be added dynamically via the API

## Server-Side Mode Setup

### Option A: Use Pinecone (Managed Service)

1. Sign up at [pinecone.io](https://www.pinecone.io)
2. Create an API endpoint that:
   - Accepts search queries
   - Returns similar documents
3. Update `VECTOR_DB_CONFIG.serverEndpoint` in `vector-db.js`

### Option B: Use Supabase with pgvector

1. Set up Supabase project
2. Enable pgvector extension
3. Create embeddings table
4. Create API endpoint for search

### Option C: Custom Backend

Create a simple Node.js/Python backend:

```python
# Example Flask endpoint
@app.route('/api/vector-search', methods=['POST'])
def vector_search():
    query = request.json['query']
    # Perform vector search
    results = search_vectors(query)
    return jsonify(results)
```

## Enhancing Responses with LLM

For better responses, integrate with an LLM API:

1. **OpenAI API**:
   ```javascript
   async function generateLLMResponse(query, context) {
     const response = await fetch('https://api.openai.com/v1/chat/completions', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${API_KEY}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         model: 'gpt-3.5-turbo',
         messages: [
           { role: 'system', content: 'You are a helpful assistant answering questions about Ryan based on the provided context.' },
           { role: 'user', content: `Context: ${context}\n\nQuestion: ${query}` }
         ],
       }),
     });
     return response.json();
   }
   ```

2. **Anthropic Claude**:
   Similar approach with Claude API

3. **Open Source (Ollama)**:
   Run locally with Ollama for privacy

## File Structure

```
.
├── components/
│   ├── vector-db.js          # Vector DB implementation
│   └── cli.js                # CLI (uses vector-db)
├── scripts/
│   ├── generate_embeddings.py # Python embedding generator
│   └── generate-embeddings.js # Node.js embedding generator
├── data/
│   ├── documents/            # Your source documents
│   │   ├── cv.txt
│   │   └── about.txt
│   └── embeddings.json       # Generated embeddings (git-ignored)
└── VECTOR_DB_SETUP.md        # This file
```

## Troubleshooting

### "No embeddings found"
- Run the embedding generation script
- Check that `data/embeddings.json` exists
- Verify the file contains valid JSON

### "Embedding generation failed"
- Ensure documents exist in `data/documents/`
- Check file encoding (should be UTF-8)
- Verify dependencies are installed

### Slow responses
- Use hybrid mode (pre-computed embeddings)
- Reduce `maxResults` in search
- Use a faster embedding model

### Poor search results
- Increase chunk overlap in `chunkText()`
- Lower similarity threshold
- Add more context to documents
- Use a better embedding model

## Advanced: Custom Embedding Models

For better results, use larger models:

**Python:**
```python
EMBEDDING_MODEL = 'all-mpnet-base-v2'  # Better but slower
```

**JavaScript:**
```javascript
embeddingModel: 'Xenova/all-mpnet-base-v2'
```

## Privacy Considerations

- **Hybrid/Client Mode**: All processing happens locally or in the browser
- **Server Mode**: Documents are sent to your server
- **LLM Integration**: Queries may be sent to external APIs

For maximum privacy, use hybrid mode with a local LLM (Ollama).

## Next Steps

1. ✅ Set up hybrid mode with your CV
2. Add more documents (projects, research papers, etc.)
3. Fine-tune chunk sizes for your content
4. Integrate LLM for better response generation
5. Add document upload functionality (client-side mode)

