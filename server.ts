import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import { createBareServer } from '@tomphttp/bare-server-node';
import http from 'http';

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
  const bare = createBareServer('/bare/');
  const server = http.createServer();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Specifically serve our custom uv.config.js and sw.js from public
  app.get('/uv/uv.config.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(process.cwd(), 'public', 'uv', 'uv.config.js'));
  });

  app.get('/uv/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(process.cwd(), 'public', 'uv', 'sw.js'));
  });

  // Serve Ultraviolet assets
  const uvPath = path.join(process.cwd(), 'node_modules', '@titaniumnetwork-dev', 'ultraviolet', 'dist');
  app.use('/uv/', express.static(uvPath));

  // Serve Libcurl and Epoxy transports
  const libcurlPath = path.join(process.cwd(), 'node_modules', '@mercuryworkshop', 'libcurl-transport', 'dist');
  app.use('/uv/libcurl/', express.static(libcurlPath));
  
  // Also provide a direct link for uv.config.js to find it easily
  app.get('/uv/libcurl.js', (req, res) => {
    res.sendFile(path.join(libcurlPath, 'index.js'));
  });

  // API Routes
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
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Removed app.listen because we use server.listen for Bare+Express

  server.on('upgrade', (req, socket, head) => {
    if (bare.shouldRoute(req)) {
      bare.routeUpgrade(req, socket, head);
    } else {
      // Allow other upgrades if needed (like HMR)
    }
  });

  server.on('request', (req, res) => {
    if (bare.shouldRoute(req)) {
      bare.routeRequest(req, res);
    } else {
      app(req, res);
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
