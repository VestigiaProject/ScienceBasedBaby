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

CRITICAL: Format your response EXACTLY as follows, using these EXACT markers:

<PROS>
• Each evidence-supported benefit or positive finding
• One point per line, starting with • and citation numbers in [n]
• If no evidence-based pros exist, include ONLY something like: • No scientifically proven benefits found
</PROS>

<CONS>
• Each evidence-supported risk or concern
• One point per line, starting with • and citation numbers in [n]
• If no evidence-based cons exist, include ONLY something like: • No scientifically proven risks found
</CONS>

<CITATIONS>
[1] First citation with DOI or URL
[2] Second citation with DOI or URL
[3] And so on...
</CITATIONS>

IMPORTANT:
- Use ONLY the exact markers <PROS>, </PROS>, <CONS>, </CONS>, <CITATIONS>, </CITATIONS>
- Start each point with • (bullet point)
- Include citation numbers [n] at the end of each point
- Citations must be numbered sequentially [1], [2], etc. WITHOUT bullet points
- If no evidence exists for pros or cons, explicitly state that
- Ensure all citations are from scientific sources`
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