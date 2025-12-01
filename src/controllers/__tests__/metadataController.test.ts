/**
 * Metadata Controller Tests
 * ToIP Trust Registry v2 Backend
 */

import request from 'supertest';
import app from '../../index';

describe('TRQP Metadata Endpoint', () => {
  describe('GET /v2/metadata', () => {
    it('should return registry metadata', async () => {
      const response = await request(app)
        .get('/v2/metadata')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('protocol');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body).toHaveProperty('supportedActions');
      expect(response.body).toHaveProperty('supportedDIDMethods');
      expect(response.body).toHaveProperty('features');
    });

    it('should include TRQP v2 protocol information', async () => {
      const response = await request(app)
        .get('/v2/metadata')
        .expect(200);

      expect(response.body).toHaveProperty('protocol', 'ToIP Trust Registry Query Protocol v2');
      expect(response.body).toHaveProperty('version', '2.0.0');
      expect(String(response.body.specification)).toContain('trustoverip.github.io');
    });

    it('should include all required endpoints', async () => {
      const response = await request(app)
        .get('/v2/metadata')
        .expect(200);

      const endpoints = response.body.endpoints as Record<string, unknown>;
      
      // Core TRQP endpoints
      expect(endpoints).toHaveProperty('authorization');
      expect(endpoints).toHaveProperty('recognition');
      expect(endpoints).toHaveProperty('metadata');
      
      // Public endpoints
      const publicEndpoints = endpoints.public as Record<string, unknown>;
      expect(publicEndpoints).toHaveProperty('registries');
      expect(publicEndpoints).toHaveProperty('issuers');
      expect(publicEndpoints).toHaveProperty('verifiers');
      expect(publicEndpoints).toHaveProperty('schemas');
    });

    it('should list supported TRQP actions', async () => {
      const response = await request(app)
        .get('/v2/metadata')
        .expect(200);

      const supportedActions = response.body.supportedActions as string[];
      
      expect(supportedActions).toContain('issue');
      expect(supportedActions).toContain('verify');
      expect(supportedActions).toContain('recognize');
      expect(supportedActions).toContain('govern');
      expect(supportedActions).toContain('delegate');
    });

    it('should list supported DID methods', async () => {
      const response = await request(app)
        .get('/v2/metadata')
        .expect(200);

      const supportedDIDMethods = response.body.supportedDIDMethods as string[];
      
      expect(supportedDIDMethods).toContain('web');
      expect(supportedDIDMethods).toContain('key');
      expect(supportedDIDMethods).toContain('indy');
    });

    it('should include feature flags', async () => {
      const response = await request(app)
        .get('/v2/metadata')
        .expect(200);

      const features = response.body.features as Record<string, boolean>;
      
      expect(features.authorization).toBe(true);
      expect(features.recognition).toBe(true);
      expect(features.delegation).toBe(true);
      expect(features.federation).toBe(true);
      expect(features.signedEntries).toBe(true);
      expect(features.auditLog).toBe(true);
      expect(features.publicTrustedList).toBe(true);
    });

    it('should include operational status', async () => {
      const response = await request(app)
        .get('/v2/metadata')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'operational');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should include documentation link', async () => {
      const response = await request(app)
        .get('/v2/metadata')
        .expect(200);

      expect(response.body).toHaveProperty('documentation');
      expect(String(response.body.documentation)).toContain('/api-docs');
    });

    it('should be accessible without authentication', async () => {
      // No X-API-Key header
      const response = await request(app)
        .get('/v2/metadata')
        .expect(200);

      expect(response.body).toHaveProperty('name');
    });

    it('should include timestamp in ISO format', async () => {
      const response = await request(app)
        .get('/v2/metadata')
        .expect(200);

      const timestamp = String(response.body.timestamp);
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      
      // Should be a valid date
      const date = new Date(timestamp);
      expect(date.toString()).not.toBe('Invalid Date');
    });
  });

  describe('Service Discovery Use Case', () => {
    it('should provide enough info for client auto-configuration', async () => {
      const response = await request(app)
        .get('/v2/metadata')
        .expect(200);

      const metadata = response.body as Record<string, unknown>;
      const endpoints = metadata.endpoints as Record<string, unknown>;
      const features = metadata.features as Record<string, boolean>;

      // Client can discover endpoints
      expect(endpoints.authorization).toBeDefined();
      expect(endpoints.recognition).toBeDefined();
      
      // Client can check capabilities
      expect(metadata.supportedActions).toBeInstanceOf(Array);
      expect(metadata.supportedDIDMethods).toBeInstanceOf(Array);
      
      // Client can check features
      expect(typeof features.authorization).toBe('boolean');
      expect(typeof features.recognition).toBe('boolean');
      
      // Client can get documentation
      expect(metadata.documentation).toBeDefined();
    });
  });

  describe('Federation Use Case', () => {
    it('should provide protocol compatibility information', async () => {
      const response = await request(app)
        .get('/v2/metadata')
        .expect(200);

      const metadata = response.body as Record<string, unknown>;
      const features = metadata.features as Record<string, boolean>;
      const supportedActions = metadata.supportedActions as string[];

      // Other registries can check compatibility
      expect(metadata.protocol).toBe('ToIP Trust Registry Query Protocol v2');
      expect(metadata.version).toBe('2.0.0');
      
      // Check if recognition is supported
      expect(features.recognition).toBe(true);
      expect(supportedActions).toContain('recognize');
    });
  });
});
