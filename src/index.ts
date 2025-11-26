/**
 * ToIP Trust Registry v2 - Backend API
 * Main application entry point
 */

/* eslint-disable no-console */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { env, isDevelopment } from './config/env';
import { swaggerSpec } from './config/swagger';

// Initialize Express application
const app: Application = express();

// Configuration
const PORT: number = env.PORT;
const HOST: string = env.HOST;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 service:
 *                   type: string
 *                   example: ToIP Trust Registry v2
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
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

// Serve swagger.json as static file
app.get('/api-docs/swagger.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Swagger API Documentation with enhanced options
const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .scheme-container { 
      background: #fafafa; 
      padding: 20px; 
      margin: 20px 0;
      border-radius: 4px;
    }
    .swagger-ui .servers { 
      margin: 20px 0; 
    }
    .swagger-ui .servers-title {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .swagger-ui select {
      font-size: 14px;
      padding: 8px;
      border-radius: 4px;
    }
  `,
  customSiteTitle: 'ToIP Trust Registry v2 API Documentation',
  swaggerOptions: {
    url: '/api-docs/swagger.json',
    deepLinking: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    defaultModelsExpandDepth: 3,
    defaultModelExpandDepth: 3,
    displayOperationId: false,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai',
    },
    tryItOutEnabled: true,
    requestSnippetsEnabled: true,
    persistAuthorization: true,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
  },
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// API Routes
import apiKeyRoutes from './routes/apiKeyRoutes';
import trustFrameworkRoutes from './routes/trustFrameworkRoutes';
import trustRegistryRoutes from './routes/trustRegistryRoutes';

app.use('/v2/api-keys', apiKeyRoutes);
app.use('/v2/trust-frameworks', trustFrameworkRoutes);
app.use('/v2/registries', trustRegistryRoutes);

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
    console.log(`📖 API Documentation: http://${HOST}:${PORT}/api-docs`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    if (isDevelopment) {
      console.log(`⚙️  Configuration loaded and validated`);
    }
  });
}

export default app;
