export function enhanceQuery(question: string): string {
  return `${question}" Give the pros and cons after having searched answers in scientific and peer-reviewed publications exclusively, not low-quality media.
- CRITICAL: Format your response EXACTLY as follows, using these EXACT markers: <PROS>, </PROS>, <CONS>, </CONS>
- Start each pro or con point with • (bullet point).
-Search information only in 'site:pubmed.ncbi.nlm.nih.gov', 'site:jamanetwork.com', 'site:ncbi.nlm.nih.gov'`;
}