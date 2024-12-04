import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const question = event.queryStringParameters?.question;

        if (!question) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Question is required' })
            };
        }

        const baseUrl = 'https://44c57909-d9e2-41cb-9244-9cd4a443cb41.app.bhs.ai.cloud.ovh.net';
        const apiKey = process.env.OPENPERPLEX_API_KEY;

        const options = {
            user_prompt: question,
            system_prompt: `You are a scientific research assistant specializing in pregnancy and parenting topics.
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
- If no evidence exists for pros or cons, explicitly state that`,
            location: 'fr',
            pro_mode: false,
            search_type: "general",
            return_images: false,
            return_sources: false,
            recency_filter: "anytime",
            temperature: 0.2,
            top_p: 0.9
        };

        const params = new URLSearchParams(options);

        const response = await fetch(`${baseUrl}/custom_search?${params}`, {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to query OpenPerplex API',
                details: error instanceof Error ? error.message : 'Unknown error'
            })
        };
    }
};
