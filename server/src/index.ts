import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { config } from './config';
import { sessionMiddleware } from './middleware/session';
import { authMiddleware } from './middleware/auth';
import { authRoutes } from './routes/auth.routes';
import { setupHttpProxy } from './proxy/http-proxy';
import { setupWsProxy } from './proxy/ws-proxy';

const app = express();
const server = createServer(app);

// Middleware
app.use(sessionMiddleware);
app.use(express.json());

// Auth routes (no proxy, no auth required)
app.use('/bff', authRoutes);

// All /v1/* routes proxy to Orket (requires auth)
app.use('/v1', authMiddleware, setupHttpProxy());

// Serve Vue SPA in production
if (config.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, config.CLIENT_DIST_PATH);
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile('index.html', { root: clientDist });
  });
}

// WebSocket upgrade handling
setupWsProxy(server);

server.listen(config.PORT, () => {
  console.log(`OrketUI BFF listening on http://localhost:${config.PORT}`);
  console.log(`Proxying to Orket API at ${config.ORKET_API_URL}`);
  console.log(`apiKeyConfigured=${Boolean(config.ORKET_API_KEY)}`);
  console.log(`demoPasswordSource=${config.DEMO_PASSWORD_SOURCE}`);
  console.log(`demoPasswordLength=${config.DEMO_PASSWORD_LENGTH}`);
});
