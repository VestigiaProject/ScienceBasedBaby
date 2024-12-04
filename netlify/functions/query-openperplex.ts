import { Handler } from '@netlify/functions';
import { customSearch } from '../../src/services/openperplex';

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

    const response = await customSearch(question, systemPrompt);

    return {
      statusCode: 200,
      body: JSON.stringify({
        choices: [{
          message: {
            content: response.llm_response
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