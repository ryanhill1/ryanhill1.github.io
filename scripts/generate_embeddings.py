#!/usr/bin/env python3
"""
Python script to generate embeddings for documents
(More efficient than Node.js version)

Usage:
    pip install sentence-transformers
    python scripts/generate_embeddings.py
"""

import json
import os
from pathlib import Path
from sentence_transformers import SentenceTransformer

# Configuration
EMBEDDING_MODEL = 'all-MiniLM-L6-v2'  # Lightweight, fast model
OUTPUT_FILE = Path(__file__).parent.parent / 'data' / 'embeddings.json'
DOCUMENTS_DIR = Path(__file__).parent.parent / 'data' / 'documents'

# Documents to process
DOCUMENTS = [
    {
        'file': 'cv.txt',  # Your CV as plain text
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
    # Add more documents here
]


def chunk_text(text, chunk_size=500, overlap=50):
    """Split text into overlapping chunks."""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    
    return chunks


def generate_embeddings():
    """Generate embeddings for all documents."""
    print('Loading embedding model...')
    model = SentenceTransformer(EMBEDDING_MODEL)
    
    all_embeddings = []
    
    for doc in DOCUMENTS:
        file_path = DOCUMENTS_DIR / doc['file']
        
        if not file_path.exists():
            print(f'Warning: File not found: {file_path}')
            continue
        
        print(f'Processing {doc["file"]}...')
        text = file_path.read_text(encoding='utf-8')
        chunks = chunk_text(text)
        
        print(f'  Generating embeddings for {len(chunks)} chunks...')
        embeddings = model.encode(chunks, normalize_embeddings=True)
        
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            all_embeddings.append({
                'id': f"{doc['metadata']['type']}_{i}",
                'text': chunk,
                'embedding': embedding.tolist(),
                'metadata': {
                    **doc['metadata'],
                    'chunkIndex': i,
                    'totalChunks': len(chunks),
                    'sourceFile': doc['file'],
                },
            })
    
    # Save embeddings
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(
        json.dumps({'embeddings': all_embeddings}, indent=2),
        encoding='utf-8',
    )
    
    print(f'\n✅ Generated {len(all_embeddings)} embeddings')
    print(f'Saved to: {OUTPUT_FILE}')


if __name__ == '__main__':
    generate_embeddings()

