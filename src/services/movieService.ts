const BASE_URL = '/api/c-data';

const safeFetch = async (url: string) => {
  const response = await fetch(url);
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    if (contentType?.includes('application/json')) {
      const errorData = await response.json();
      const message = errorData.error === 'TMDB Service Error' 
        ? `TMDB Error: ${errorData.details?.status_message || 'Access Denied'}`
        : errorData.error || `Server returned ${response.status}`;
      throw new Error(message);
    }
    throw new Error(`Server returned ${response.status}`);
  }

  if (!contentType?.includes('application/json')) {
    const text = await response.text();
    const snippet = text.substring(0, 100).replace(/<[^>]*>/g, '');
    console.error('Non-JSON response received:', text.substring(0, 500));
    throw new Error(`Proxy configuration error: Received ${contentType || 'no content type'} instead of JSON. (Snippet: ${snippet}...)`);
  }

  return response.json();
};

export interface MediaContent {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids: number[];
  number_of_seasons?: number;
  seasons?: {
    season_number: number;
    episode_count: number;
    name: string;
  }[];
}

export const movieService = {
  getTrending: async (type: 'movie' | 'tv' = 'movie'): Promise<MediaContent[]> => {
    const data = await safeFetch(`${BASE_URL}/trending/${type}/week`);
    return data.results || [];
  },

  getPopular: async (type: 'movie' | 'tv' = 'movie'): Promise<MediaContent[]> => {
    const data = await safeFetch(`${BASE_URL}/${type}/popular`);
    return data.results || [];
  },

  checkHealth: async () => {
    try {
      const resp = await fetch('/api/cinema-health');
      return resp.ok;
    } catch {
      return false;
    }
  },

  searchMedia: async (query: string, type: 'movie' | 'tv' = 'movie'): Promise<MediaContent[]> => {
    if (!query) return [];
    const data = await safeFetch(`${BASE_URL}/search/${type}?query=${encodeURIComponent(query)}`);
    return data.results || [];
  },

  getDetails: async (id: string, type: 'movie' | 'tv' = 'movie'): Promise<MediaContent | null> => {
    const data = await safeFetch(`${BASE_URL}/${type}/${id}`);
    return data;
  },

  getSeasonDetails: async (tvId: string, seasonNumber: number) => {
    return await safeFetch(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}`);
  },

  getPosterUrl: (path: string, size: 'small' | 'medium' | 'large' | 'original' = 'medium') => {
    if (!path) return '';
    const sizes = {
      small: 'w185',
      medium: 'w500',
      large: 'w780',
      original: 'original'
    };
    return `https://image.tmdb.org/t/p/${sizes[size]}${path}`;
  },

  getBackdropUrl: (path: string, size: 'small' | 'medium' | 'large' | 'original' = 'large') => {
    if (!path) return '';
    const sizes = {
      small: 'w300',
      medium: 'w780',
      large: 'w1280',
      original: 'original'
    };
    return `https://image.tmdb.org/t/p/${sizes[size]}${path}`;
  }
};
