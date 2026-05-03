const TMDB_API_KEY = (import.meta as any).env.VITE_TMDB_API_KEY || '15e241bab4affc62f00422929d7efd8a';
const BASE_URL = 'https://api.themoviedb.org/3';

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
    try {
      const response = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error(`Error fetching trending ${type}:`, error);
      return [];
    }
  },

  getPopular: async (type: 'movie' | 'tv' = 'movie'): Promise<MediaContent[]> => {
    try {
      const response = await fetch(`${BASE_URL}/${type}/popular?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error(`Error fetching popular ${type}:`, error);
      return [];
    }
  },

  searchMedia: async (query: string, type: 'movie' | 'tv' = 'movie'): Promise<MediaContent[]> => {
    if (!query) return [];
    try {
      const response = await fetch(`${BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error(`Error searching ${type}:`, error);
      return [];
    }
  },

  getDetails: async (id: string, type: 'movie' | 'tv' = 'movie'): Promise<MediaContent | null> => {
    try {
      const response = await fetch(`${BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching ${type} details:`, error);
      return null;
    }
  },

  getSeasonDetails: async (tvId: string, seasonNumber: number) => {
    try {
      const response = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching season details:', error);
      return null;
    }
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
  }
};
