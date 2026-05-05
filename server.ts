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
  app.get('/api/movie-proxy/:path(*)', async (req, res) => {
    const TMDB_API_KEY = '15e241bab4affc62f00422929d7efd8a';
    const pathValue = req.params.path;
    
    // Construct the TMDB URL
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'api_key') {
        queryParams.append(key, String(value));
      }
    }
    queryParams.set('api_key', TMDB_API_KEY);
    
    const url = `https://api.themoviedb.org/3/${pathValue}?${queryParams.toString()}`;

    console.log(`[Cinema-Proxy] Request: ${req.url} -> ${url}`);

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'YeebsCinema/1.0'
        }
      });

      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
          console.error(`[Cinema-Proxy] TMDB rejection (${response.status}):`, data);
          return res.status(response.status).json({ 
            error: 'TMDB reported an issue', 
            status: response.status,
            details: data 
          });
        }
        return res.json(data);
      } else {
        const text = await response.text();
        console.error(`[Cinema-Proxy] Protocol violation: Received non-JSON response (${response.status}) from ${url}`);
        console.error(`[Cinema-Proxy] Snapshot: ${text.substring(0, 100)}...`);
        return res.status(502).json({ 
          error: 'The downstream provider returned an invalid format (HTML)', 
          status: response.status,
          preview: text.substring(0, 50)
        });
      }
    } catch (error) {
      console.error(`[Cinema-Proxy] Failed to establish link to ${url}:`, error);
      return res.status(503).json({ 
        error: 'Cinema proxy link failure', 
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
