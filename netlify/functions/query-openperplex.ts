import { Handler } from '@netlify/functions';

const BASE_URL = 'https://44c57909-d9e2-41cb-9244-9cd4a443cb41.app.bhs.ai.cloud.ovh.net';

function enhanceQuery(question: string): string {
  return `The user has asked something about: "${question}" Give the pros and cons after having searched answers in scientific and peer-reviewed publications exclusively, not low-quality media. Only search in sites like https://pubmed.ncbi.nlm.nih.gov/, https://jamanetwork.com/ or https://www.ncbi.nlm.nih.gov/guide/all/. 
- CRITICAL: Format your response EXACTLY as follows, using these EXACT markers: <PROS>, </PROS>, <CONS>, </CONS>
- Start each pro or con point with • (bullet point)
inurl:'pubmed.ncbi.nlm.nih.gov', inurl:'jamanetwork.com', inurl:'ncbi.nlm.nih.gov'`;
}

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
Format your response EXACTLY as follows, using these EXACT markers:

<PROS>
• Each evidence-supported benefit or positive finding
• One point per line, starting with • and citation numbers in [n]
• If no evidence-based pros exist, include ONLY: • No scientifically proven benefits found
</PROS>

<CONS>
• Each evidence-supported risk or concern
• One point per line, starting with • and citation numbers in [n]
• If no evidence-based cons exist, include ONLY: • No scientifically proven risks found
</CONS>

<CITATIONS>
[1] First citation with DOI or URL
[2] Second citation with DOI or URL
[3] And so on...
</CITATIONS>`;

    const enhancedQuestion = enhanceQuery(question);

    const options = {
      user_prompt: enhancedQuestion,
      system_prompt: systemPrompt,
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