import { Handler } from '@netlify/functions';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
  environment: process.env.PINECONE_ENVIRONMENT!,
});

const index = pinecone.index(process.env.PINECONE_INDEX!);
const SIMILARITY_THRESHOLD = 0.85;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { query } = JSON.parse(event.body || '');

    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Query is required' })
      };
    }

    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      input: query,
      model: 'text-embedding-3-small'
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Search for similar vectors
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: 1,
      includeMetadata: true
    });

    const match = queryResponse.matches[0];
    const hasSimilarAnswer = match && match.score! >= SIMILARITY_THRESHOLD;

    return {
      statusCode: 200,
      body: JSON.stringify({
        found: hasSimilarAnswer,
        answer: hasSimilarAnswer ? match.metadata : null,
        score: match?.score,
        usage: embeddingResponse.usage
      })
    };
  } catch (error) {
    console.error('Similar search error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to search for similar answers',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}