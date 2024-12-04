export interface SearchOptions {
  user_prompt: string;
  system_prompt: string;
  location?: string;
  pro_mode?: boolean;
  search_type?: 'general' | 'news';
  return_images?: boolean;
  return_sources?: boolean;
  recency_filter?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'anytime';
  temperature?: number;
  top_p?: number;
}

export interface OpenPerplexResponse {
  llm_response: string;
  response_time: number;
  sources?: string[];
}