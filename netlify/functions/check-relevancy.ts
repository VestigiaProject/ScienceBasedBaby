import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RelevancyResponse {
  relevancy: boolean;
}

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

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a system that checks if a user message is related to pregnancy or childcare. Answer always with a json formatted with \"relevancy: true\" or \"relevancy: false\""
        },
        {
          role: "user",
          content: query
        }
      ],
      response_format: { type: "json_object" },
      temperature: 1,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    });

    // Log OpenAI response details
    console.log('OpenAI Response:', {
      model: response.model,
      content: response.choices[0].message.content,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens,
        completion_tokens: response.usage?.completion_tokens,
        total_tokens: response.usage?.total_tokens
      },
      finish_reason: response.choices[0].finish_reason,
      created: new Date(response.created * 1000).toISOString(),
      response_ms: Date.now() - (response.created * 1000)
    });

    const result = JSON.parse(response.choices[0].message.content) as RelevancyResponse;

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        isRelevant: result.relevancy,
        debug: {
          tokens: response.usage,
          model: response.model,
          finish_reason: response.choices[0].finish_reason
        }
      })
    };
  } catch (error) {
    console.error('OpenAI relevancy check error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to check relevancy',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}