import React from 'react';
import { Bug, Search, Trophy, TrendingUp, Home } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGames } from '../context/GameContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery, setSortBy } = useGames();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const handleNavClick = (path: string, sort?: string) => {
    if (sort) {
      setSortBy(sort);
    } else {
      setSortBy('newest'); // default
    }
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass h-16 px-4 md:px-8 flex items-center justify-between">
      <Link to="/" onClick={() => handleNavClick('/')} className="flex items-center gap-2 group">
        <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/40 transition-colors">
          <Bug className="w-6 h-6 text-primary rotate-180" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight uppercase">
          YEEBS<span className="text-primary">GAMES</span>
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {[
          { name: 'Home', icon: Home, path: '/', sort: 'newest' },
          { name: 'Trending', icon: TrendingUp, path: '/', sort: 'trending' },
          { name: 'Top Rated', icon: Trophy, path: '/', sort: 'top' },
        ].map((item) => (
          <button
            key={item.name}
            onClick={() => handleNavClick(item.path, item.sort)}
            className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary
              ${location.pathname === item.path ? 'text-primary' : 'text-gray-400'}`}
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative group hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-all w-48 md:w-64"
          />
        </div>
        <button className="sm:hidden p-2 text-gray-400">
          <Search className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
