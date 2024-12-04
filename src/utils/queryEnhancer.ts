export function enhanceQuery(question: string): string {
  return `${question} site:pubmed.ncbi.nlm.nih.gov, site:jamanetwork.com, site:ncbi.nlm.nih.gov`;
}