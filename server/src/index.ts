import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/client';
import apiRouter from './routes/index';
import { YieldAgent } from './agents/YieldAgent';
import { SettlementRelay } from './agents/SettlementRelay';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const NODE_ENV = process.env.NODE_ENV ?? 'development';

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();

// ---- Middleware ----

app.use(
  cors({
    origin:
      NODE_ENV === 'production'
        ? ['https://app.hush.finance']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  _res.on('finish', () => {
    const elapsed = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} → ${_res.statusCode} (${elapsed}ms)`
    );
  });
  next();
});

// Request ID
app.use((req: Request, res: Response, next: NextFunction) => {
  const id =
    (req.headers['x-request-id'] as string | undefined) ??
    `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  res.setHeader('X-Request-ID', id);
  next();
});

// ---- Routes ----

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '0.1.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1', apiRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server] Unhandled error:', err);
  const message =
    NODE_ENV === 'development' && err instanceof Error
      ? err.message
      : 'Internal server error';
  res.status(500).json({ error: message });
});

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------
const yieldAgent = new YieldAgent();
const settlementRelay = new SettlementRelay();

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  try {
    // 1. Initialize DB (migrations + seed)
    await initializeDatabase();

    // 2. Start background agents
    yieldAgent.start();
    settlementRelay.start();

    // 3. Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`\n╔══════════════════════════════════════════╗`);
      console.log(`║   HUSH API Server v0.1.0                 ║`);
      console.log(`╠══════════════════════════════════════════╣`);
      console.log(`║  Listening on  http://localhost:${PORT}     ║`);
      console.log(`║  Environment   ${NODE_ENV.padEnd(26)} ║`);
      console.log(`║  Health check  /health                   ║`);
      console.log(`║  API base      /api/v1                   ║`);
      console.log(`╚══════════════════════════════════════════╝\n`);
    });

    // 4. Clean shutdown handler
    const shutdown = async (signal: string): Promise<void> => {
      console.log(`\n[Server] Received ${signal} — shutting down gracefully...`);

      // Stop agents first
      yieldAgent.stop();
      settlementRelay.stop();

      // Close HTTP server (stop accepting new connections)
      server.close((err) => {
        if (err) {
          console.error('[Server] Error during shutdown:', err);
          process.exit(1);
        }
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        console.error('[Server] Forced shutdown after timeout.');
        process.exit(1);
      }, 10_000).unref();
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('uncaughtException', (err) => {
      console.error('[Server] Uncaught exception:', err);
      void shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason) => {
      console.error('[Server] Unhandled rejection:', reason);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
}

void main();
