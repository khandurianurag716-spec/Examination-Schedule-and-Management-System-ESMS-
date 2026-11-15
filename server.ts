import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeDatabase } from './backend/database/db.ts';
import authRoutes from './backend/routes/authRoutes.ts';
import studentRoutes from './backend/routes/studentRoutes.ts';
import facultyRoutes from './backend/routes/facultyRoutes.ts';
import adminRoutes from './backend/routes/adminRoutes.ts';

async function startServer() {
  // Initialize SQLite schema and seed demo data if empty
  initializeDatabase();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'GEHU ESMS API' });
  });

  // Mount Role-Based API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/student', studentRoutes);
  app.use('/api/faculty', facultyRoutes);
  app.use('/api/admin', adminRoutes);

  // Return clean JSON error for unmatched /api routes
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Vite integration in development; static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GEHU ESMS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start ESMS server:', err);
  process.exit(1);
});
