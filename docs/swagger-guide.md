# Swagger Documentation Guide
## ToIP Trust Registry v2 Backend

This guide explains how to add Swagger/OpenAPI annotations to new endpoints in the ToIP Trust Registry v2 API.

---

## 📚 Overview

We use **swagger-jsdoc** to generate OpenAPI 3.0 documentation from JSDoc comments in our route files. The Swagger UI is available at `/api-docs` when the server is running.

---

## 🎯 Quick Start

### 1. Basic Endpoint Documentation

Add a JSDoc comment block above your route definition with the `@swagger` tag:

```typescript
/**
 * @swagger
 * /v2/your-endpoint:
 *   get:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [Your Tag]
 *     responses:
 *       200:
 *         description: Success response
 */
router.get('/your-endpoint', handler);
```

### 2. Common Patterns

#### GET Endpoint (List with Pagination)

```typescript
/**
 * @swagger
 * /v2/resources:
 *   get:
 *     summary: List all resources
 *     description: Retrieve a paginated list of resources
 *     tags: [Resources]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of resources
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Resource'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
```

#### GET Endpoint (Single Resource)

```typescript
/**
 * @swagger
 * /v2/resources/{id}:
 *   get:
 *     summary: Get resource by ID
 *     description: Retrieve a single resource
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

#### POST Endpoint (Create)

```typescript
/**
 * @swagger
 * /v2/resources:
 *   post:
 *     summary: Create a new resource
 *     description: Create a new resource with the provided data
 *     tags: [Resources]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Resource
 *               description:
 *                 type: string
 *                 example: Resource description
 *     responses:
 *       201:
 *         description: Resource created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Resource created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

#### PUT Endpoint (Update)

```typescript
/**
 * @swagger
 * /v2/resources/{id}:
 *   put:
 *     summary: Update a resource
 *     description: Update an existing resource
 *     tags: [Resources]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Resource ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resource updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

#### DELETE Endpoint

```typescript
/**
 * @swagger
 * /v2/resources/{id}:
 *   delete:
 *     summary: Delete a resource
 *     description: Delete a resource by ID
 *     tags: [Resources]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Resource deleted successfully
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
```

---

## 🔐 Authentication

For endpoints that require authentication, add the `security` field:

```yaml
security:
  - ApiKeyAuth: []
```

This indicates that the endpoint requires an API key in the `X-API-Key` header.

---

## 📦 Defining Schemas

### Option 1: Reference Existing Schema

Use `$ref` to reference schemas defined in `src/config/swagger.ts`:

```yaml
schema:
  $ref: '#/components/schemas/TrustFramework'
```

### Option 2: Inline Schema

Define the schema inline for simple objects:

```yaml
schema:
  type: object
  properties:
    id:
      type: string
      format: uuid
    name:
      type: string
```

### Option 3: Add New Global Schema

To add a new reusable schema, edit `src/config/swagger.ts`:

```typescript
components: {
  schemas: {
    YourNewSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
        },
        name: {
          type: 'string',
        },
      },
    },
  },
}
```

---

## 🏷️ Tags

Tags group related endpoints in the Swagger UI. Use existing tags or add new ones in `src/config/swagger.ts`:

```typescript
tags: [
  {
    name: 'Your Tag',
    description: 'Description of your endpoints',
  },
]
```

---

## 📝 Best Practices

### 1. Always Include

- **summary**: Brief one-line description
- **description**: Detailed explanation
- **tags**: For grouping endpoints
- **responses**: At least 200 and error responses

### 2. Response Codes

Common HTTP status codes to document:

- `200`: Success (GET, PUT, DELETE)
- `201`: Created (POST)
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid API key)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

### 3. Examples

Always provide examples for:
- Request body properties
- Query parameters
- Response data

```yaml
example: My Example Value
```

### 4. Required Fields

Mark required fields in request bodies:

```yaml
required:
  - name
  - email
```

### 5. Enums

For fields with limited values:

```yaml
enum: [active, inactive, deprecated]
```

### 6. Formats

Use standard formats:
- `uuid`: UUID strings
- `date-time`: ISO 8601 timestamps
- `uri`: URLs
- `email`: Email addresses

---

## 🧪 Testing Your Documentation

1. Start the server:
   ```bash
   npm run dev
   ```

2. Open Swagger UI:
   ```
   http://localhost:3000/api-docs
   ```

3. Verify:
   - Endpoint appears in correct tag group
   - Request/response schemas are correct
   - Examples are helpful
   - "Try it out" button works

---

## 📋 Template for New Endpoints

```typescript
/**
 * @swagger
 * /v2/your-endpoint:
 *   method:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [Your Tag]
 *     security:
 *       - ApiKeyAuth: []  # If authentication required
 *     parameters:
 *       - in: path/query
 *         name: paramName
 *         required: true/false
 *         schema:
 *           type: string
 *         description: Parameter description
 *     requestBody:  # For POST/PUT
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - field1
 *             properties:
 *               field1:
 *                 type: string
 *                 example: Example value
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/YourSchema'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.method('/your-endpoint', middleware, handler);
```

---

## 🔗 Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)

---

## 💡 Tips

1. **Keep it DRY**: Use `$ref` for reusable schemas
2. **Be Specific**: Provide clear descriptions and examples
3. **Test Early**: Check Swagger UI after adding each endpoint
4. **Stay Consistent**: Follow the patterns in existing endpoints
5. **Document Errors**: Include all possible error responses

---

**Last Updated**: November 24, 2024  
**Version**: 1.0
