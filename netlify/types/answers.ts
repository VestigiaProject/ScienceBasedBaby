export interface CachedAnswer {
  pros: string[];
  cons: string[];
  citations: Array<{
    id: number;
    text: string;
    url?: string;
  }>;
}