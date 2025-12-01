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

      expect(response.body.protocol).toBe('ToIP Trust Registry Query Protocol v2');
      expect(response.body.version).toBe('2.0.0');
      expect(response.body.specification).toContain('trustoverip.github.io');
    });

    it('should include all required endpoints', async () => {
      const response = await request(app)
        .get('/v2/metadata')
        .expect(200);

      const { endpoints } = response.body;
      
      // Core TRQP endpoints
      expect(endpoints).toHaveProperty('authorization');
      expect(endpoints).toHaveProperty('recognition');
      expect(endpoints).toHaveProperty('metadata');
      
      // Public endpoints
      expect(endpoints.public).toHaveProperty('registries');
      expect(endpoints.public).toHaveProperty('issuers');
      expect(endpoints.public).toHaveProperty('verifiers');
      expect(endpoints.public).toHaveProperty('schemas');
    });

    it('should list supported TRQP actions', async () => {
      const response = await request(app)
        .get('/v2/metadata')
        .expect(200);

      const { supportedActions } = response.body;
      
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

      const { supportedDIDMethods } = response.body;
      
      expect(supportedDIDMethods).toContain('web');
      expect(supportedDIDMethods).toContain('key');
      expect(supportedDIDMethods).toContain('indy');
    });

    it('should include feature flags', async () => {
      const response = await request(app)
        .get('/v2/metadata')
        .expect(200);

      const { features } = response.body;
      
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

      expect(response.body.status).toBe('operational');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should include documentation link', async () => {
      const response = await request(app)
        .get('/v2/metadata')
        .expect(200);

      expect(response.body).toHaveProperty('documentation');
      expect(response.body.documentation).toContain('/api-docs');
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

      const timestamp = response.body.timestamp;
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

      const metadata = response.body;

      // Client can discover endpoints
      expect(metadata.endpoints.authorization).toBeDefined();
      expect(metadata.endpoints.recognition).toBeDefined();
      
      // Client can check capabilities
      expect(metadata.supportedActions).toBeInstanceOf(Array);
      expect(metadata.supportedDIDMethods).toBeInstanceOf(Array);
      
      // Client can check features
      expect(typeof metadata.features.authorization).toBe('boolean');
      expect(typeof metadata.features.recognition).toBe('boolean');
      
      // Client can get documentation
      expect(metadata.documentation).toBeDefined();
    });
  });

  describe('Federation Use Case', () => {
    it('should provide protocol compatibility information', async () => {
      const response = await request(app)
        .get('/v2/metadata')
        .expect(200);

      const metadata = response.body;

      // Other registries can check compatibility
      expect(metadata.protocol).toBe('ToIP Trust Registry Query Protocol v2');
      expect(metadata.version).toBe('2.0.0');
      
      // Check if recognition is supported
      expect(metadata.features.recognition).toBe(true);
      expect(metadata.supportedActions).toContain('recognize');
    });
  });
});
