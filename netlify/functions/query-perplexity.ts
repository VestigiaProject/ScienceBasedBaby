import { Handler } from '@netlify/functions';

const OPENPERPLEX_API_URL = 'https://api.openperplex.com/api/v1/search';

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

    const enhancedQuery = `The user has asked something about: "${question}" Give the pros and cons after having searched answers in scientific and peer-reviewed publications exclusively, not low-quality media. Only search in sites like https://pubmed.ncbi.nlm.nih.gov/, https://jamanetwork.com/ or https://www.ncbi.nlm.nih.gov/guide/all/. 
- CRITICAL: Format your response EXACTLY as follows, using these EXACT markers: <PROS>, </PROS>, <CONS>, </CONS>
- Start each pro or con point with • (bullet point)
- Include citation numbers [n] at the end of each point`;

    const response = await fetch(OPENPERPLEX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENPERPLEX_API_KEY}`,
      },
      body: JSON.stringify({
        query: enhancedQuery,
        location: 'us',
        pro_mode: true,
        response_language: 'en',
        answer_type: 'text',
        verbose_mode: false,
        search_type: 'general',
        return_citations: false,
        return_sources: true,
        return_images: false,
        recency_filter: 'anytime'
      })
    });

    if (!response.ok) {
      throw new Error(`OpenPerplex API request failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
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