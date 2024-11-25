import { Handler } from '@netlify/functions';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { CachedAnswer } from '../types/answers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pc = new Pinecone();
const index = pc.index(process.env.PINECONE_INDEX!);
const SIMILARITY_THRESHOLD = 0.85;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    console.log('🔍 Starting similar search...');
    const { query } = JSON.parse(event.body || '');

    if (!query) {
      console.log('❌ No query provided');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Query is required' })
      };
    }

    console.log('📝 Generating embedding for query:', query);
    const embeddingResponse = await openai.embeddings.create({
      input: query,
      model: 'text-embedding-3-small'
    });
    
    console.log('✅ Embedding generated:', {
      dimensions: embeddingResponse.data[0].embedding.length,
      usage: embeddingResponse.usage
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;

    console.log('🔍 Searching Pinecone index...');
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: 1,
      includeMetadata: true
    });

    const match = queryResponse.matches[0];
    const hasSimilarAnswer = match && match.score! >= SIMILARITY_THRESHOLD;

    console.log('📊 Search results:', {
      found: hasSimilarAnswer,
      score: match?.score,
      threshold: SIMILARITY_THRESHOLD
    });

    let answer: CachedAnswer | null = null;
    if (hasSimilarAnswer && match.metadata) {
      // Deserialize the metadata back into the original format
      const metadata = match.metadata as any;
      answer = {
        pros: metadata.pros.split('|||'),
        cons: metadata.cons.split('|||'),
        citations: JSON.parse(metadata.citations)
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        found: hasSimilarAnswer,
        answer,
        score: match?.score,
        usage: embeddingResponse.usage
      })
    };
  } catch (error) {
    console.error('❌ Similar search error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to search for similar answers',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}