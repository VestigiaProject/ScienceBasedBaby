import { CachedAnswer } from '../types/answers';

export async function findSimilarAnswer(query: string): Promise<CachedAnswer | null> {
  try {
    const response = await fetch('/.netlify/functions/search-similar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error('Failed to search for similar answers');
    }

    const data = await response.json();
    return data.found ? data.answer : null;
  } catch (error) {
    return null;
  }
}

export async function cacheAnswer(query: string, answer: CachedAnswer): Promise<void> {
  try {
    const originalQuery = query.split('"')[1] || query;
    
    const response = await fetch('/.netlify/functions/cache-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: originalQuery,
        answer 
      })
    });

    if (!response.ok) {
      throw new Error('Failed to cache answer');
    }
  } catch (error) {
    // Silently fail as caching errors shouldn't affect the user experience
  }
}