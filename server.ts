import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectDB } from './server/db.ts';
import apiRoutes from './server/routes/api.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Connect to Database (real MongoDB or embedded MongoMemoryServer)
  try {
    await connectDB();
  } catch (err) {
    console.error('Failed to initialize database connection:', err);
    process.exit(1);
  }

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use('/api', apiRoutes);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'BizTrack API', timestamp: new Date() });
  });

  if (!isProduction) {
    // Development mode: use Vite's connect instance as middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Production mode: serve static files from dist directory
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      // Fallback if built files not found
      app.get('*', (_req, res) => {
        res.send('Production build not found. Please run "npm run build".');
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BizTrack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
