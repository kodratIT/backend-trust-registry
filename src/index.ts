/**
 * ToIP Trust Registry v2 - Backend API
 * Main application entry point
 */

/* eslint-disable no-console */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { env, isDevelopment } from './config/env';

// Initialize Express application
const app: Application = express();

// Configuration
const PORT: number = env.PORT;
const HOST: string = env.HOST;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ToIP Trust Registry v2',
    version: '1.0.0',
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'ToIP Trust Registry v2 API',
    version: '1.0.0',
    documentation: '/api-docs',
  });
});

// API Routes
import apiKeyRoutes from './routes/apiKeyRoutes';
import trustFrameworkRoutes from './routes/trustFrameworkRoutes';

app.use('/v2/api-keys', apiKeyRoutes);
app.use('/v2/trust-frameworks', trustFrameworkRoutes);

// Import error handlers
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`📚 Health check: http://${HOST}:${PORT}/health`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    if (isDevelopment) {
      console.log(`⚙️  Configuration loaded and validated`);
    }
  });
}

export default app;
