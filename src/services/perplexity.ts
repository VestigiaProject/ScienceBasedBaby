interface PerplexityResponse {
  pros: string[];
  cons: string[];
  citations: Array<{
    id: number;
    text: string;
    url?: string;
  }>;
}

interface PerplexityAPIResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  model: string;
  created: number;
}

const PERPLEXITY_API_KEY = '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';
const SYSTEM_PROMPT = `You are a scientific research assistant specializing in pregnancy and parenting topics. 
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
• Include DOI or PubMed URL when available.`;

export async function queryPerplexity(question: string): Promise<PerplexityResponse> {
  try {
    console.log('Sending request to Perplexity API with question:', question);
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: question }
        ]
      })
    });

    console.log('API Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error response:', errorData);
      throw new Error(`API request failed: ${response.status} ${errorData}`);
    }

    const data: PerplexityAPIResponse = await response.json();
    console.log('Raw API response:', data);
    
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Invalid response format from API');
    }

    // Parse the response content into structured format
    const sections = content.split('\n\n');
    const result: PerplexityResponse = {
      pros: [],
      cons: [],
      citations: []
    };

    let currentSection: 'pros' | 'cons' | 'citations' | null = null;

    sections.forEach(section => {
      const lines = section.trim().split('\n');
      const header = lines[0].toLowerCase();

      if (header.includes('pros:')) {
        currentSection = 'pros';
        lines.shift();
      } else if (header.includes('cons:')) {
        currentSection = 'cons';
        lines.shift();
      } else if (header.includes('citations:')) {
        currentSection = 'citations';
        lines.shift();
      }

      if (currentSection === 'citations') {
        const items = lines
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => {
            // Extract citation number and text
            const match = line.match(/^\[(\d+)\]\s*(.+)$/);
            if (!match) return null;

            const [, idStr, text] = match;
            const id = parseInt(idStr, 10);

            // Try to extract DOI or URL
            const urlMatch = text.match(/(?:doi\.org\/|(?:https?:\/\/)?(?:dx\.doi\.org\/|doi:))(10\.\d{4,}\/[-._;()\/:A-Z0-9]+)/i) ||
                           text.match(/(https?:\/\/[^\s]+)/i);
            
            return {
              id,
              text,
              url: urlMatch ? (urlMatch[0].startsWith('http') ? urlMatch[0] : `https://doi.org/${urlMatch[1]}`) : undefined
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);

        result.citations.push(...items);
      } else if (currentSection) {
        const items = lines
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => line.replace(/^[•\-\s]+/, '')); // Remove bullet points and leading spaces

        result[currentSection].push(...items);
      }
    });

    console.log('Parsed result:', result);
    return result;
    
  } catch (error) {
    console.error('Error in queryPerplexity:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get scientific analysis. Please try again.');
  }
}