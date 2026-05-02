import { Game } from './types';

export const GAMES: Game[] = [
  {
    id: '1v1-lol',
    title: '1v1.lol',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800',
    url: '/games/1v1-lol.html',
    category: 'Action',
    description: 'A third-person shooter and building simulator. Master your building skills and take down opponents in intense 1v1 battles.',
    playCount: 1200,
    rating: 4.8
  },
  {
    id: 'baldis-basics',
    title: "Baldi's Basics",
    thumbnail: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
    url: '/games/baldis-basics.html',
    category: 'Horror',
    description: 'A meta horror game that’s really weird, with no real educational value to be found.',
    playCount: 850,
    rating: 4.2
  },
  {
    id: 'among-us',
    title: 'Among Us',
    thumbnail: 'https://images.unsplash.com/photo-1615468551061-0d3a7761007a?auto=format&fit=crop&q=80&w=800',
    url: '/games/among-us.html',
    category: 'Action',
    description: 'Play with 4-15 players online or via local WiFi as you attempt to prepare your spaceship for departure.',
    playCount: 3400,
    rating: 4.9
  },
  {
    id: 'agario',
    title: 'Agario',
    thumbnail: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800',
    url: '/games/agario.html',
    category: 'IO',
    description: 'Control your tiny cell and eat other players to grow larger! Avoid being eaten as much as possible.',
    playCount: 2100,
    rating: 4.5
  },
  {
    id: '2048',
    title: '2048',
    thumbnail: 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&q=80&w=800',
    url: '/games/2048.html',
    category: 'Puzzle',
    description: 'Join the numbers and get to the 2048 tile!',
    playCount: 1560,
    rating: 4.7
  }
];
