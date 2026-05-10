import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';

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
  app.all('/api/movie-proxy/*', async (req, res) => {
    // Priority: Environment Variable > Hardcoded Fallback
    const TMDB_API_KEY = process.env.TMDB_API_KEY || '15e241bab4affc62f00422929d7efd8a';
    
    // Extract everything after /api/movie-proxy/
    // Path might come in without a trailing slash depending on how it was routed
    let pathValue = req.path.replace(/^\/api\/movie-proxy/, '');
    if (pathValue.startsWith('/')) {
      pathValue = pathValue.substring(1);
    }
    
    // Construct the TMDB URL
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'api_key') {
        queryParams.append(key, String(value));
      }
    }
    queryParams.set('api_key', TMDB_API_KEY);
    
    if (pathValue.includes('trending') || pathValue.includes('popular') || pathValue.includes('top_rated')) {
      if (!queryParams.has('language')) {
        queryParams.set('language', 'en-US');
      }
    }

    const url = `https://api.themoviedb.org/3/${pathValue}?${queryParams.toString()}`;

    console.log(`[Cinema-Proxy] [${req.method}] ${req.url} -> ${url}`);

    try {
      const response = await fetch(url, {
        method: req.method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'YeebsCinema/1.2 (CloudRun; Node)'
        }
      });

      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        // Forward the specific status code from TMDB
        if (!response.ok) {
          console.error(`[Cinema-Proxy] TMDB rejection (${response.status}) at ${pathValue}:`, JSON.stringify(data).substring(0, 500));
          return res.status(response.status).json({ 
            error: 'TMDB Service Error', 
            status: response.status,
            details: data 
          });
        }
        
        // Cache control for trending/popular
        if (pathValue.includes('trending') || pathValue.includes('popular')) {
          res.setHeader('Cache-Control', 'public, max-age=3600');
        }
        
        return res.json(data);
      } else {
        const text = await response.text();
        console.error(`[Cinema-Proxy] Protocol violation from TMDB: Received ${contentType} instead of JSON (${response.status}) at ${url}`);
        return res.status(502).json({ 
          error: 'Invalid response from movie database',
          status: response.status,
          type: contentType,
          preview: text.substring(0, 500)
        });
      }
    } catch (error) {
      console.error(`[Cinema-Proxy] Fetch failure to ${url}:`, error);
      return res.status(503).json({ 
        error: 'Cinema proxy upstream connection failure', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.get('/api/cinema-health', (req, res) => {
    res.json({ status: 'Online', system: 'Cinema Proxy v2.0' });
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
