import { Handler } from '@netlify/functions';
import { SYSTEM_PROMPT, enhanceUserPrompt } from '../../src/utils/prompts';

const BASE_URL = 'https://44c57909-d9e2-41cb-9244-9cd4a443cb41.app.bhs.ai.cloud.ovh.net';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { question } = JSON.parse(event.body || '');

    if (!question) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Question is required' })
      };
    }

    const options = {
      user_prompt: enhanceUserPrompt(question),
      system_prompt: SYSTEM_PROMPT,
      location: 'us',
      pro_mode: false,
      search_type: 'general',
      return_images: false,
      return_sources: true,
      recency_filter: 'anytime',
      temperature: 0.2,
      top_p: 0.9
    };

    const response = await fetch(`${BASE_URL}/custom_search`, {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.OPENPERPLEX_API_KEY || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        choices: [{
          message: {
            content: data.llm_response
          }
        }]
      })
    };
  } catch (error) {
    console.error('OpenPerplex API error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to query OpenPerplex API',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}