import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

console.log('[System] Environment variables loaded:', {
  hasCloudflareToken: !!process.env.CLOUDFLARE_TOKEN,
  hasZoneId: !!process.env.ZONE_ID,
  hasMainUrl: !!process.env.MAIN_HOSTING_URL,
  mainUrl: process.env.MAIN_HOSTING_URL
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAMES_FILE = path.join(__dirname, 'games-db.json');
const CUSTOM_GAMES_DIR = path.join(__dirname, 'public', 'games', 'custom');

// Ensure database and directory exists
if (!fs.existsSync(GAMES_FILE)) {
  fs.writeFileSync(GAMES_FILE, JSON.stringify([]));
}
if (!fs.existsSync(CUSTOM_GAMES_DIR)) {
  fs.mkdirSync(CUSTOM_GAMES_DIR, { recursive: true });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.all('/api/c-data*', async (req, res) => {
    // Priority: Environment Variable > Hardcoded Fallback
    const TMDB_API_KEY = process.env.TMDB_API_KEY || '15e241bab4affc62f00422929d7efd8a';
    
    // Extract subpath from the full path
    // Using req.originalUrl split by '?' to ignore query params
    const fullUrl = req.originalUrl.split('?')[0];
    let pathValue = fullUrl.replace(/^\/api\/c-data/, '');
    
    // Cleanup leading/trailing slashes
    pathValue = pathValue.replace(/^\/+/, '').replace(/\/+$/, '');
    
    // If no path provided, return status
    if (!pathValue || pathValue === '') {
      return res.json({ 
        status: 'Proxy ready', 
        info: 'TMDB API Gateway v2.5',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        endpoint: 'https://api.themoviedb.org/3'
      });
    }
    
    // Construct the TMDB URL
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'api_key') {
        queryParams.append(key, String(value));
      }
    }
    queryParams.set('api_key', TMDB_API_KEY);
    
    // Standard defaults for TMDB
    if (pathValue.includes('trending') || pathValue.includes('popular') || pathValue.includes('top_rated')) {
      if (!queryParams.has('language')) {
        queryParams.set('language', 'en-US');
      }
    }

    const url = `https://api.themoviedb.org/3/${pathValue}?${queryParams.toString()}`;

    console.log(`[Cinema-Proxy] [${req.method}] ${pathValue} -> ID:${TMDB_API_KEY.substring(0,4)}...`);

    try {
      const response = await fetch(url, {
        method: req.method,
        headers: {
          'Accept': 'application/json'
        }
      });

      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (!response.ok) {
          console.error(`[Cinema-Proxy] TMDB rejection (${response.status}) at ${pathValue}:`, JSON.stringify(data).substring(0, 200));
          return res.status(response.status).json({ 
            error: 'TMDB Service Error', 
            status: response.status,
            details: data 
          });
        }
        
        if (pathValue.includes('trending') || pathValue.includes('popular')) {
          res.setHeader('Cache-Control', 'public, max-age=3600');
        }
        
        return res.json(data);
      } else {
        const text = await response.text();
        console.error(`[Cinema-Proxy] Internal Protocol Error: Received ${contentType} from API at ${pathValue}`);
        return res.status(502).json({ 
          error: 'The movie database returned an invalid response format (Expected JSON)',
          status: response.status,
          type: contentType,
          preview: text.substring(0, 200)
        });
      }
    } catch (error) {
      console.error(`[Cinema-Proxy] Fatal Upstream Error:`, error);
      return res.status(503).json({ 
        error: 'The cinema proxy could not reach the movie database', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.get('/api/cinema-health', async (req, res) => {
    const TMDB_API_KEY = process.env.TMDB_API_KEY || '15e241bab4affc62f00422929d7efd8a';
    try {
      // Test TMDB connection (authentication endpoint is good for checking API key)
      const testResp = await fetch(`https://api.themoviedb.org/3/authentication?api_key=${TMDB_API_KEY}`);
      const testData = await testResp.json();
      res.json({ 
        status: 'Online', 
        system: 'Cinema Proxy v2.3', 
        tmdb: testResp.ok ? 'Connected' : 'Auth Failed',
        tmdbStatus: testResp.status,
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      res.status(500).json({ status: 'Degraded', error: 'TMDB Unreachable' });
    }
  });

  app.post('/api/admin/generate-mirrors', async (req, res) => {
    const { password } = req.body;
    if (password !== '$#GS29gs67') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = process.env.CLOUDFLARE_TOKEN;
    const zoneId = process.env.ZONE_ID;
    const mainUrl = process.env.MAIN_HOSTING_URL;

    console.log('[Admin] Mirror creation request received');
    
    if (!token || !zoneId || !mainUrl) {
      return res.status(500).json({ 
        error: 'Cloudflare configuration missing',
        details: { token: !!token, zone: !!zoneId, url: !!mainUrl }
      });
    }

    const subdomains: string[] = [];
    while (subdomains.length < 5) {
      const str = crypto.randomBytes(3).toString('hex');
      if (!subdomains.includes(str)) subdomains.push(str);
    }

    const results = [];
    for (const sub of subdomains) {
      try {
        console.log(`[Admin] Registering subdomain: ${sub}.${mainUrl}`);
        const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'CNAME',
            name: sub,
            content: mainUrl,
            ttl: 1,
            proxied: true
          })
        });
        
        const contentType = response.headers.get('content-type');
        let result: any;
        
        if (contentType && contentType.includes('application/json')) {
          result = await response.json();
        } else {
          const text = await response.text();
          throw new Error(`Cloudflare returned non-JSON response: ${text.substring(0, 100)}`);
        }

        console.log(`[Admin] Cloudflare response for ${sub}:`, { status: response.status, success: result?.success });
        
        if (result && !result.success) {
          console.error(`[Admin] Cloudflare errors for ${sub}:`, result.errors);
        }
        
        results.push({ 
          subdomain: sub, 
          success: result?.success || false, 
          errors: result?.errors || [] 
        });
      } catch (e) {
        console.error(`[Admin] Error for ${sub}:`, e);
        results.push({ subdomain: sub, success: false, error: String(e) });
      }
    }

    res.json({ success: true, results, mainUrl });
  });

  // Proxy endpoint for Supabase writes if client-side is restricted
  app.post('/api/admin/supabase-proxy', async (req, res) => {
    const { password, table, data } = req.body;
    if (password !== '$#GS29gs67') return res.status(401).json({ error: 'Unauthorized' });
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Supabase not configured on server' });

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const err = await response.json();
        return res.status(response.status).json(err);
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/api/supabase-config', (req, res) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    res.json({
      supabaseUrl,
      supabaseKey,
      isConfigured: !!(supabaseUrl && supabaseKey)
    });
  });

  let discoveryCache: { data: any, timestamp: number } | null = null;
  const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  app.get('/api/games-discovery', async (req, res) => {
    console.log('[Discover] Request received at /api/games-discovery');
    
    // Return cached data if fresh
    if (discoveryCache && (Date.now() - discoveryCache.timestamp < CACHE_DURATION)) {
      console.log('[Discover] Serving from server cache');
      return res.json(discoveryCache.data);
    }

    const tryFetch = async (url: string, sourceName: string, transform: (data: any) => any[]) => {
      try {
        console.log(`[Discover] Fetching from ${sourceName}...`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
          }
        });
        clearTimeout(timeout);

        if (!response.ok) {
          console.warn(`[Discover] ${sourceName} returned status ${response.status}`);
          return null;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn(`[Discover] ${sourceName} returned non-JSON content type: ${contentType}`);
          return null;
        }

        const data = await response.json();
        return transform(data);
      } catch (err) {
        console.error(`[Discover] Error fetching from ${sourceName}:`, err instanceof Error ? err.message : String(err));
        return null;
      }
    };

    try {
      // Try FreeToGame
      let games = await tryFetch(
        'https://www.freetogame.com/api/games?platform=browser',
        'FreeToGame',
        (data) => (data as any[]).slice(0, 80).map(g => ({
          id: `ftg-${g.id}`,
          title: g.title,
          description: g.short_description || 'No description available',
          category: g.genre || 'Action',
          thumbnail: g.thumbnail,
          url: g.game_url,
          instruction: 'Follow on-screen prompts.',
          tags: [g.genre, g.publisher].filter(Boolean)
        }))
      );

      // Try Gamemonetize if FreeToGame failed
      if (!games) {
        games = await tryFetch(
          'https://gamemonetize.com/feed.php?format=0',
          'Gamemonetize',
          (data) => (data as any[]).slice(0, 100).map(g => ({
            id: g.id || `gm-${Math.random().toString(36).substring(2, 7)}`,
            title: g.title,
            description: g.description || 'No description available',
            category: g.category || 'Casual',
            thumbnail: g.thumb || g.image,
            url: g.url,
            instruction: g.instructions || '',
            tags: g.tags ? g.tags.split(',') : []
          }))
        );
      }

      if (games && games.length > 0) {
        discoveryCache = { data: games, timestamp: Date.now() };
        return res.json(games);
      }

      // If all failed, return empty array instead of HTML error
      console.warn('[Discover] All sources failed. Returning empty list.');
      res.json([]);
    } catch (error) {
      console.error('[Discover] Fatal Error:', error);
      res.status(500).json({ error: 'Discovery engine failure', details: String(error) });
    }
  });

  app.get('/api/games', (req, res) => {
    try {
      const data = fs.readFileSync(GAMES_FILE, 'utf-8');
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: 'Failed to read games' });
    }
  });

  app.post('/api/games', (req, res) => {
    const { password, game } = req.body;
    
    if (password !== '$#GS29gs67') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const dbData = JSON.parse(fs.readFileSync(GAMES_FILE, 'utf-8'));
      
      // If it's a custom game with HTML block
      if (game.htmlBlock) {
        const filename = `${game.id}.html`;
        fs.writeFileSync(path.join(CUSTOM_GAMES_DIR, filename), game.htmlBlock);
        game.url = `/games/custom/${filename}`;
        delete game.htmlBlock;
      }

      dbData.push(game);
      fs.writeFileSync(GAMES_FILE, JSON.stringify(dbData, null, 2));
      res.json({ success: true, game });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to save game' });
    }
  });

  app.delete('/api/games/:id', (req, res) => {
    const { password } = req.body;
    const { id } = req.params;

    if (password !== '$#GS29gs67') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const dbData = JSON.parse(fs.readFileSync(GAMES_FILE, 'utf-8'));
      const filtered = dbData.filter((g: any) => g.id !== id);
      
      // Try to delete the HTML file if it exists
      const htmlPath = path.join(CUSTOM_GAMES_DIR, `${id}.html`);
      if (fs.existsSync(htmlPath)) {
        fs.unlinkSync(htmlPath);
      }

      fs.writeFileSync(GAMES_FILE, JSON.stringify(filtered, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete game' });
    }
  });

  // Vite middleware
  const isProd = process.env.NODE_ENV === 'production' || fs.existsSync(path.join(__dirname, 'dist'));
  
  if (!isProd) {
    console.log('[Cinema-Server] Entering DEVELOPMENT mode (Vite Middleware)');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[Cinema-Server] Entering PRODUCTION mode (Static Assets)');
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Cinema-Server] Online: http://localhost:${PORT}`);
  });
}

startServer();
