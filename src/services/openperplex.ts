import { SearchOptions } from '../types/openperplex';

const BASE_URL = 'https://44c57909-d9e2-41cb-9244-9cd4a443cb41.app.bhs.ai.cloud.ovh.net';

export async function customSearch(userPrompt: string, systemPrompt: string) {
  const options: SearchOptions = {
    user_prompt: userPrompt,
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

  const params = new URLSearchParams(options as Record<string, string>);

  try {
    const response = await fetch(`${BASE_URL}/custom_search?${params}`, {
      method: 'GET',
      headers: {
        'X-API-Key': process.env.OPENPERPLEX_API_KEY || '',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('OpenPerplex API error:', error);
    throw error;
  }
}