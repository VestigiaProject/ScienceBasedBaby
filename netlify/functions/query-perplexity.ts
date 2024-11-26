import { Handler } from '@netlify/functions';

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

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          { 
            role: 'system', 
            content: `You are a scientific research assistant specializing in pregnancy and parenting topics. 
For the given question, look up evidence-based information ONLY from peer-reviewed scientific studies and medical research websites.
Format your response EXACTLY as follows:

PROS:
• List each evidence-supported benefit or positive finding, with citation numbers in square brackets [1]
• One point per line, starting with a bullet point, based on a scientific study.

CONS:
• List each evidence-supported risk or concern, with citation numbers in square brackets [1]
• One point per line, starting with a bullet point, based on a scientific study.

CITATIONS:
• List each scientific paper or medical journal referenced
• One citation per line, starting with [number]
• Include DOI or PubMed URL when available.`
          },
          { role: 'user', content: question }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Perplexity API Error:', errorData);
      throw new Error(`API request failed: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Perplexity API error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to query Perplexity API',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}