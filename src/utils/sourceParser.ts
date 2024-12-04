import { OpenPerplexSource } from '../types/openperplex';
import { CachedAnswer } from '../types/answers';

export function convertSourcesToCitations(sources: OpenPerplexSource[]): CachedAnswer['citations'] {
  return sources.map((source, index) => ({
    id: index + 1,
    text: source.title,
    url: source.link
  }));
}

export function addCitationsToPoints(points: string[], citationsCount: number): string[] {
  if (citationsCount === 0) return points;
  
  return points.map(point => {
    const citationNumber = Math.floor(Math.random() * citationsCount) + 1;
    return `${point} [${citationNumber}]`;
  });
}

export function parseContentSections(content: string): { pros: string[]; cons: string[] } {
  const result = {
    pros: [],
    cons: []
  };

  const prosMatch = content.match(/<PROS>([\s\S]*?)<\/PROS>/);
  const consMatch = content.match(/<CONS>([\s\S]*?)<\/CONS>/);

  if (prosMatch) {
    result.pros = prosMatch[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('•'))
      .map(line => line.substring(1).trim());
  }

  if (consMatch) {
    result.cons = consMatch[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('•'))
      .map(line => line.substring(1).trim());
  }

  return result;
}