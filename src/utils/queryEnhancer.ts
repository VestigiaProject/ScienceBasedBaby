export function enhanceQuery(question: string): string {
  return `The user has asked something about: "${question}" Give the pros and cons after having searched answers in scientific and peer-reviewed publications exclusively, not low-quality media. Only search in sites like https://pubmed.ncbi.nlm.nih.gov/, https://jamanetwork.com/ or https://www.ncbi.nlm.nih.gov/guide/all/. 
- CRITICAL: Format your response EXACTLY as follows, using these EXACT markers: <PROS>, </PROS>, <CONS>, </CONS>
- Start each pro or con point with • (bullet point).
Search information only in site:pubmed.ncbi.nlm.nih.gov, site:jamanetwork.com, site:ncbi.nlm.nih.gov`;
}