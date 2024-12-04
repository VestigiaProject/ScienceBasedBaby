import { OpenPerplexSource } from '../types/openperplex';

export interface EnhancedQuery {
  userPrompt: string;
  systemPrompt: string;
}

export function enhanceQuery(question: string): EnhancedQuery {
  const userPrompt = `Give the pros and cons about "${question}" site:https://pubmed.ncbi.nlm.nih.gov/ Format your response EXACTLY as follows, using these EXACT markers: <PROS>, </PROS>, <CONS>, </CONS>
- Start each pro or con point with • (bullet point).`;

  const systemPrompt = `You are a scientific research assistant specializing in pregnancy and parenting topics.
For the given question, look up evidence-based information ONLY from peer-reviewed scientific studies and medical research websites like pubmed.ncbi.nlm.nih.gov, jamanetwork.com, ncbi.nlm.nih.gov.

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
- If no evidence exists for pros or cons, explicitly state that.`;

  return { userPrompt, systemPrompt };
}