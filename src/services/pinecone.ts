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
    console.error('Error finding similar answer:', error);
    return null;
  }
}

export async function cacheAnswer(query: string, answer: CachedAnswer): Promise<void> {
  try {
    const response = await fetch('/.netlify/functions/cache-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, answer })
    });

    if (!response.ok) {
      throw new Error('Failed to cache answer');
    }

    console.log('Successfully cached answer');
  } catch (error) {
    console.error('Error caching answer:', error);
  }
}