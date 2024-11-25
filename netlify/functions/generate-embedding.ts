import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { text } = JSON.parse(event.body || '');

    if (!text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Text is required' })
      };
    }

    const response = await openai.embeddings.create({
      input: text,
      model: 'text-embedding-3-small'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        embedding: response.data[0].embedding,
        usage: response.usage
      })
    };
  } catch (error) {
    console.error('OpenAI embedding error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate embedding',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}