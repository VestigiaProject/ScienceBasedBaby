import { Handler } from '@netlify/functions';

const BASE_URL = 'https://44c57909-d9e2-41cb-9244-9cd4a443cb41.app.bhs.ai.cloud.ovh.net';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    console.log('🔍 Starting OpenPerplex query...');
    const { question } = JSON.parse(event.body || '');

    if (!question) {
      console.log('❌ No question provided');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Question is required' })
      };
    }

    const systemPrompt = `You are a scientific research assistant specializing in pregnancy and parenting topics.
For the given question, look up evidence-based information ONLY from peer-reviewed scientific studies and medical research websites.

CRITICAL: Format your response EXACTLY as follows, using these EXACT markers:

<PROS>
• Each evidence-supported benefit or positive finding
• One point per line, starting with •
• If no evidence-based pros exist, include ONLY something like: • No scientifically proven benefits found
</PROS>

<CONS>
• Each evidence-supported risk or concern
• One point per line, starting with •
• If no evidence-based cons exist, include ONLY something like: • No scientifically proven risks found
</CONS>

IMPORTANT:
- Use ONLY the exact markers <PROS>, </PROS>, <CONS>, </CONS>
- Start each point with • (bullet point)
- If no evidence exists for pros or cons, explicitly state that`;

    console.log('📝 Sending request to OpenPerplex...');
    const response = await fetch(`${BASE_URL}/custom_search`, {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.OPENPERPLEX_API_KEY || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_prompt: question,
        system_prompt: systemPrompt,
        location: 'us',
        pro_mode: true,
        search_type: 'general',
        return_images: false,
        return_sources: true,
        recency_filter: 'anytime',
        temperature: 0.2,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ OpenPerplex response received:', {
      hasResponse: !!data.llm_response,
      responseLength: data.llm_response?.length,
      sourcesCount: data.sources?.length,
      responseTime: data.response_time
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        choices: [{
          message: {
            content: data.llm_response
          }
        }],
        sources: data.sources || []
      })
    };
  } catch (error) {
    console.error('❌ OpenPerplex API error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to query OpenPerplex API',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}