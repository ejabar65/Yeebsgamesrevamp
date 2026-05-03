const TMDB_API_KEY = (import.meta as any).env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

export const movieService = {
  getTrending: async (): Promise<Movie[]> => {
    if (!TMDB_API_KEY) return [];
    try {
      const response = await fetch(`${BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      return [];
    }
  },

  getPopular: async (): Promise<Movie[]> => {
    if (!TMDB_API_KEY) return [];
    try {
      const response = await fetch(`${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      return [];
    }
  },

  searchMovies: async (query: string): Promise<Movie[]> => {
    if (!TMDB_API_KEY || !query) return [];
    try {
      const response = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching movies:', error);
      return [];
    }
  },

  getMovieDetails: async (id: string): Promise<Movie | null> => {
    if (!TMDB_API_KEY) return null;
    try {
      const response = await fetch(`${BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching movie details:', error);
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
