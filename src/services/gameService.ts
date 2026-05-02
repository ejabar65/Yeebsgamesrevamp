import { GAMES as STATIC_GAMES } from '../constants';
import { Game } from '../types';

export async function getGames(): Promise<Game[]> {
  try {
    const response = await fetch('/api/games');
    if (!response.ok) throw new Error('Failed to fetch custom games');
    const customGames = await response.json();
    return [...STATIC_GAMES, ...customGames];
  } catch (error) {
    console.error('Error fetching games:', error);
    return STATIC_GAMES;
  }
}

export async function addGame(password: string, game: any): Promise<boolean> {
  const response = await fetch('/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, game }),
  });
  return response.ok;
}

export async function deleteGame(password: string, gameId: string): Promise<boolean> {
  const response = await fetch(`/api/games/${gameId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return response.ok;
}
