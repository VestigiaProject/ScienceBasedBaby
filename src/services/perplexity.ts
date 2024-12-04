export async function queryOpenPerplex(question: string): Promise<CachedAnswer> {
  try {
      const { isRelevant } = await checkQueryRelevancy(question);

      if (!isRelevant) {
          throw new NotRelevantError();
      }

      const cachedAnswer = await findSimilarAnswer(question);
      if (cachedAnswer) {
          return cachedAnswer;
      }

      const canMakeRequest = await checkAndUpdateRequestLimit();
      if (!canMakeRequest) {
          throw new Error('Daily request limit reached. Please try again tomorrow.');
      }

      const baseUrl = 'https://44c57909-d9e2-41cb-9244-9cd4a443cb41.app.bhs.ai.cloud.ovh.net';
      const apiKey = process.env.OPENPERPLEX_API_KEY;

      const options = {
          user_prompt: question,
          system_prompt: `The user has asked something about: "${question}" Give the pros and cons after having searched answers in scientific and peer-reviewed publications exclusively, not low-quality media. Only search in sites like https://pubmed.ncbi.nlm.nih.gov/, https://jamanetwork.com/ or https://www.ncbi.nlm.nih.gov/guide/all/.
- CRITICAL: Format your response EXACTLY as follows, using these EXACT markers: <PROS>, </PROS>, <CONS>, </CONS>
- Start each pro or con point with • (bullet point)`,
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
          throw new Error(`API request failed: ${errorData.detail || `HTTP error! status: ${response.status}`}`);
      }

      const data = await response.json();

      if (!data.llm_response) {
          throw new Error('Invalid response format from OpenPerplex API');
      }

      const result = parsePerplexityResponse(data.llm_response);

      // Cache the answer asynchronously
      setTimeout(() => {
          cacheAnswer(question, result).catch(() => {});
      }, 0);

      return result;
  } catch (error) {
      if (error instanceof NotRelevantError) {
          throw error;
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to get scientific analysis. Please try again.');
  }
}
