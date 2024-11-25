export async function checkQueryRelevancy(query: string): Promise<{ isRelevant: boolean; debug?: any }> {
  try {
    const response = await fetch('/.netlify/functions/check-relevancy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error('Failed to check query relevancy');
    }

    return await response.json();
  } catch (error) {
    console.error('Relevancy check error:', error);
    // If there's an error checking relevancy, we'll assume it's relevant
    // to avoid blocking legitimate queries due to API issues
    return { isRelevant: true };
  }
}