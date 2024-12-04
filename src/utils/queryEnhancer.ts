export function enhanceQuery(question: string): string {
  return `Give the pros and cons about "${question}" site:https://pubmed.ncbi.nlm.nih.gov/ Format your response EXACTLY as follows, using these EXACT markers: <PROS>, </PROS>, <CONS>, </CONS>
- Start each pro or con point with • (bullet point).`;
}