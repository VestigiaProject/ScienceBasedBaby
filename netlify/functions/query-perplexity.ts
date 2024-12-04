import { Handler } from '@netlify/functions';

const OPENPERPLEX_BASE_URL = 'https://44c57909-d9e2-41cb-9244-9cd4a443cb41.app.bhs.ai.cloud.ovh.net';

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

    const systemPrompt = `You are a scientific research assistant specializing in pregnancy and parenting topics. 
For the given question, look up evidence-based information ONLY from peer-reviewed scientific studies and medical research websites.
Format your response EXACTLY as follows:
<PROS>
• Each evidence-supported benefit or positive finding
• One point per line, starting with • and citation numbers in [n]
</PROS>
<CONS>
• Each evidence-supported risk or concern
• One point per line, starting with • and citation numbers in [n]
</CONS>`;

    const params = new URLSearchParams({
      system_prompt: systemPrompt,
      user_prompt: question,
      location: 'us',
      pro_mode: 'true',
      search_type: 'general',
      return_sources: 'true',
      return_images: 'false',
      temperature: '0.2',
      top_p: '0.9',
      recency_filter: 'anytime'
    });

    const response = await fetch(`${OPENPERPLEX_BASE_URL}/custom_search?${params}`, {
      method: 'GET',
      headers: {
        'X-API-Key': process.env.OPENPERPLEX_API_KEY!,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenPerplex API error response:', errorText);
      throw new Error(`OpenPerplex API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.llm_response) {
      throw new Error('Invalid response format from API');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        llm_response: data.llm_response,
        sources: data.sources || [],
        response_time: data.response_time
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