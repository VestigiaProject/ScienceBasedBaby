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

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { query, answer } = JSON.parse(event.body || '');

    if (!query || !answer) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Query and answer are required' })
      };
    }

    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      input: query,
      model: 'text-embedding-3-small'
    });

    // Store in Pinecone
    await index.upsert([{
      id: Buffer.from(query).toString('base64'),
      values: embeddingResponse.data[0].embedding,
      metadata: answer
    }]);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        usage: embeddingResponse.usage
      })
    };
  } catch (error) {
    console.error('Cache answer error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to cache answer',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}