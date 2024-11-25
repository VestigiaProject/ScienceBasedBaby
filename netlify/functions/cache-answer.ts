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
    console.log('💾 Starting answer caching...');
    const { query, answer } = JSON.parse(event.body || '');

    if (!query || !answer) {
      console.log('❌ Missing query or answer');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Query and answer are required' })
      };
    }

    console.log('📝 Generating embedding for caching:', query);
    const embeddingResponse = await openai.embeddings.create({
      input: query,
      model: 'text-embedding-3-small'
    });

    console.log('✅ Embedding generated:', {
      dimensions: embeddingResponse.data[0].embedding.length,
      usage: embeddingResponse.usage
    });

    const id = Buffer.from(query).toString('base64');
    console.log('💾 Upserting to Pinecone with ID:', id);

    await index.upsert([{
      id,
      values: embeddingResponse.data[0].embedding,
      metadata: answer
    }]);

    console.log('✅ Successfully cached answer');

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        usage: embeddingResponse.usage
      })
    };
  } catch (error) {
    console.error('❌ Cache answer error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to cache answer',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}