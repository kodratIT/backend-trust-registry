/**
 * Health Check Integration Tests
 * ToIP Trust Registry v2 Backend
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { createTestRequest } from '../helpers';

describe('Health Check Integration Tests', () => {
  describe('GET /health', () => {
    it('should return 200 and health status', async () => {
      const response = await createTestRequest().get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'ToIP Trust Registry v2');
      expect(response.body).toHaveProperty('version', '1.0.0');
    });

    it('should return valid timestamp format', async () => {
      const response = await createTestRequest().get('/health');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await createTestRequest().get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'ToIP Trust Registry v2 API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('documentation', '/api-docs');
    });
  });

  describe('GET /non-existent', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await createTestRequest().get('/non-existent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('message');
    });
  });
});
