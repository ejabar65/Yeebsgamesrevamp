const BASE_URL = '/api/movie-proxy';

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
      const response = await fetch(`${BASE_URL}/trending/${type}/week`);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error(`Error fetching trending ${type}:`, error);
      return [];
    }
  },

  getPopular: async (type: 'movie' | 'tv' = 'movie'): Promise<MediaContent[]> => {
    try {
      const response = await fetch(`${BASE_URL}/${type}/popular`);
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
      const response = await fetch(`${BASE_URL}/search/${type}?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error(`Error searching ${type}:`, error);
      return [];
    }
  },

  getDetails: async (id: string, type: 'movie' | 'tv' = 'movie'): Promise<MediaContent | null> => {
    try {
      const response = await fetch(`${BASE_URL}/${type}/${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching ${type} details:`, error);
      return null;
    }
  },

  getSeasonDetails: async (tvId: string, seasonNumber: number) => {
    try {
      const response = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}`);
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
