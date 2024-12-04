export interface Source {
  title: string;
  link: string;
  snippet: string;
}

export interface CachedAnswer {
  pros: string[];
  cons: string[];
  sources: Source[];
}