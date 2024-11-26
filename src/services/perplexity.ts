import { findSimilarAnswer, cacheAnswer } from './pinecone';
import { checkQueryRelevancy } from './openai';
import { NotRelevantError } from './errors';
import { CachedAnswer } from '../types/answers';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const DAILY_REQUEST_LIMIT = 35;

async function checkAndUpdateRequestLimit(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) {
    console.log('❌ No authenticated user found');
    throw new Error('User not authenticated');
  }

  console.log('🔍 Checking request limit for user:', user.uid);
  
  const subscriptionDoc = doc(db, 'subscriptions', user.uid);
  const subscription = await getDoc(subscriptionDoc);
  const data = subscription.data();

  if (!data) {
    console.log('❌ No subscription data found for user:', user.uid);
    throw new Error('No subscription data found');
  }

  console.log('📊 Current subscription data:', {
    tracking: data.requestTracking,
    timestamp: new Date().toISOString()
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  const currentTracking = data.requestTracking || { requestCount: 0, date: 0 };
  console.log('📊 Current tracking:', currentTracking);

  if (currentTracking.date !== today) {
    console.log('📅 New day detected, resetting count');
    await setDoc(subscriptionDoc, {
      ...data,
      requestTracking: {
        requestCount: 1,
        date: today
      }
    }, { merge: true });
    console.log('✅ Counter reset to 1 for new day');
    return true;
  }

  if (!currentTracking.requestCount || currentTracking.requestCount < DAILY_REQUEST_LIMIT) {
    const newCount = (currentTracking.requestCount || 0) + 1;
    console.log(`📈 Incrementing count from ${currentTracking.requestCount} to ${newCount}`);
    await setDoc(subscriptionDoc, {
      ...data,
      requestTracking: {
        requestCount: newCount,
        date: today
      }
    }, { merge: true });
    console.log('✅ Successfully updated count');
    return true;
  }

  console.log('❌ Daily limit reached:', currentTracking.requestCount);
  return false;
}

function extractUrlFromCitation(citation: string): string | undefined {
  // Match DOI
  const doiMatch = citation.match(/(?:doi:|DOI:?\s*)?(?:https?:\/\/doi\.org\/|10\.\d{4,}\/[-._;()\/:A-Z0-9]+)/i);
  if (doiMatch) {
    const doi = doiMatch[0].replace(/^doi:/i, '').trim();
    return doi.startsWith('http') ? doi : `https://doi.org/${doi}`;
  }

  // Match PubMed URL
  const pubmedMatch = citation.match(/https?:\/\/(?:www\.)?ncbi\.nlm\.nih\.gov\/pubmed\/\d+/i);
  if (pubmedMatch) {
    return pubmedMatch[0];
  }

  // Match any URL
  const urlMatch = citation.match(/https?:\/\/[^\s<>[\]()]+[^\s.,<>[\]()]/i);
  if (urlMatch) {
    return urlMatch[0];
  }

  return undefined;
}

function parsePerplexityResponse(content: string, rawResponse: any): CachedAnswer {
  console.log('🔍 Parsing Perplexity response:', content);
  
  const result: CachedAnswer = {
    pros: [],
    cons: [],
    citations: []
  };

  try {
    // Extract content between markers using regex
    const prosMatch = content.match(/<PROS>([\s\S]*?)<\/PROS>/);
    const consMatch = content.match(/<CONS>([\s\S]*?)<\/CONS>/);
    const citationsMatch = content.match(/<CITATIONS>([\s\S]*?)<\/CITATIONS>/);

    console.log('📝 Found sections:', {
      hasPros: !!prosMatch,
      hasCons: !!consMatch,
      hasCitations: !!citationsMatch
    });

    // Process pros
    if (prosMatch) {
      result.pros = prosMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('•'))
        .map(line => line.substring(1).trim());
      console.log(`✅ Found ${result.pros.length} pros`);
    }

    // Process cons
    if (consMatch) {
      result.cons = consMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('•'))
        .map(line => line.substring(1).trim());
      console.log(`✅ Found ${result.cons.length} cons`);
    }

    // Process citations
    if (citationsMatch) {
      const citationLines = citationsMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && (line.startsWith('[') || line.startsWith('•')))
        .map(line => line.startsWith('•') ? line.substring(1).trim() : line);

      result.citations = citationLines.map((citation, index) => {
        const url = extractUrlFromCitation(citation);
        return {
          id: index + 1,
          text: citation.replace(/^(?:\[\d+\]|\•)\s*/, '').trim(),
          url
        };
      });
      console.log(`✅ Found ${result.citations.length} citations`);
    }
  } catch (error) {
    console.error('❌ Error parsing response:', error);
    throw new Error('Failed to parse response format');
  }

  // Validation
  if (result.pros.length === 0 && result.cons.length === 0) {
    console.error('❌ No pros or cons found in parsed result');
    throw new Error('Invalid response format: no pros or cons found');
  }

  console.log('📊 Final parsed result:', {
    prosCount: result.pros.length,
    consCount: result.cons.length,
    citationsCount: result.citations.length
  });

  return result;
}

export async function queryPerplexity(question: string): Promise<CachedAnswer> {
  try {
    console.log('🔍 Starting query process for:', question);
    
    console.log('Checking query relevancy...');
    const { isRelevant, debug } = await checkQueryRelevancy(question);
    console.log('Relevancy check result:', { isRelevant, debug });
    
    if (!isRelevant) {
      console.log('❌ Query deemed not relevant');
      throw new NotRelevantError();
    }

    console.log('🔍 Searching for cached similar answers...');
    const cachedAnswer = await findSimilarAnswer(question);
    if (cachedAnswer) {
      console.log('✅ Found cached answer:', cachedAnswer);
      return cachedAnswer;
    }
    console.log('❌ No cached answer found, proceeding with Perplexity API');

    const canMakeRequest = await checkAndUpdateRequestLimit();
    if (!canMakeRequest) {
      throw new Error('Daily request limit reached. Please try again tomorrow.');
    }

    const enhancedQuery = `The user has asked something about: "${question}" Give the pros and cons after having searched answers in scientific and peer-reviewed publications exclusively, not low-quality media. 
- CRITICAL: Format your response EXACTLY as follows, using these EXACT markers: <PROS>, </PROS>, <CONS>, </CONS>, <CITATIONS>, </CITATIONS>
- Start each pro or con point with • (bullet point)
- Citations must be numbered sequentially [1], [2], etc. WITHOUT bullet points
- Include citation numbers [n] at the end of each point
- Ensure all citations are from scientific sources. inurl:pubmed.ncbi.nlm.nih.gov`;

    const response = await fetch('/.netlify/functions/query-perplexity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: enhancedQuery })
    });

    console.log('API Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error response:', errorData);
      throw new Error(`API request failed: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    console.log('Raw API response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from API');
    }

    const result = parsePerplexityResponse(data.choices[0].message.content, data);
    console.log('📝 Parsed result:', result);

    console.log('💾 Caching new answer...');
    await cacheAnswer(question, result); // Use original question for caching
    console.log('✅ Answer cached successfully');

    return result;
  } catch (error) {
    console.error('❌ Error in queryPerplexity:', error);
    if (error instanceof NotRelevantError) {
      throw error;
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to get scientific analysis. Please try again.');
  }
}