import { CachedAnswer } from '../types/answers';

export async function findSimilarAnswer(query: string): Promise<CachedAnswer | null> {
  try {
    console.log('🔍 Searching for similar answer for query:', query);
    
    const response = await fetch('/.netlify/functions/search-similar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      console.error('❌ Search similar response not OK:', response.status);
      throw new Error('Failed to search for similar answers');
    }

    const data = await response.json();
    console.log('📊 Similar search result:', {
      found: data.found,
      score: data.score,
      usage: data.usage
    });

    return data.found ? data.answer : null;
  } catch (error) {
    console.error('❌ Error finding similar answer:', error);
    return null;
  }
}

export async function cacheAnswer(query: string, answer: CachedAnswer): Promise<void> {
  try {
    console.log('💾 Caching answer for query:', query);
    
    const response = await fetch('/.netlify/functions/cache-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, answer })
    });

    if (!response.ok) {
      console.error('❌ Cache response not OK:', response.status);
      throw new Error('Failed to cache answer');
    }

    const data = await response.json();
    console.log('✅ Answer cached successfully:', {
      success: data.success,
      usage: data.usage
    });
  } catch (error) {
    console.error('❌ Error caching answer:', error);
  }
}