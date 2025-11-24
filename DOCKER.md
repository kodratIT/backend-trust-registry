# Docker Setup Guide
## ToIP Trust Registry v2 Backend

This guide explains how to run the ToIP Trust Registry v2 Backend using Docker and Docker Compose.

---

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB free disk space
- Ports available: 3000, 5432, 6379

---

## 🚀 Quick Start

### Development Environment

1. **Copy environment file**:
```bash
cp .env.example .env
```

2. **Start all services**:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

3. **View logs**:
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

4. **Stop services**:
```bash
docker-compose -f docker-compose.dev.yml down
```

### Production Environment

1. **Copy and configure environment**:
```bash
cp .env.example .env
# Edit .env with production values
```

2. **Build and start**:
```bash
docker-compose up -d
```

3. **View logs**:
```bash
docker-compose logs -f api
```

---

## 🏗️ Architecture

### Services

**PostgreSQL** (`postgres`):
- Image: `postgres:15-alpine`
- Port: `5432`
- Volume: `postgres_data` (persistent)
- Health check: Every 10s

**Redis** (`redis`):
- Image: `redis:7-alpine`
- Port: `6379`
- Volume: `redis_data` (persistent)
- Max memory: 256MB (production), 128MB (dev)
- Eviction policy: `allkeys-lru`

**API Server** (`api`):
- Build: Custom Dockerfile
- Port: `3000`
- Depends on: PostgreSQL, Redis
- Health check: `/health` endpoint

### Networks

All services run on isolated bridge network:
- Production: `toip-network`
- Development: `toip-dev-network`

---

## 📦 Docker Compose Files

### `docker-compose.yml` (Production)
- Multi-stage build for smaller image
- Non-root user for security
- Production-optimized settings
- Persistent volumes

### `docker-compose.dev.yml` (Development)
- Hot reload enabled
- Source code mounted as volume
- Debug logging enabled
- Development database

---

## 🔧 Configuration

### Environment Variables

**Required**:
```bash
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/toip_registry?schema=public
REDIS_URL=redis://:redis@redis:6379
REGISTRY_DID=did:web:example.com
```

**Optional**:
```bash
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
REGISTRY_NAME="ToIP Trust Registry"
```

### Database Configuration

**PostgreSQL Settings**:
```bash
DB_NAME=toip_registry
DB_USER=postgres
DB_PASSWORD=postgres  # Change in production!
DB_PORT=5432
```

**Redis Settings**:
```bash
REDIS_PASSWORD=redis  # Change in production!
REDIS_PORT=6379
```

---

## 🛠️ Common Commands

### Development

**Start services**:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

**Rebuild after code changes**:
```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

**View API logs**:
```bash
docker-compose -f docker-compose.dev.yml logs -f api
```

**Access PostgreSQL**:
```bash
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d toip_registry_dev
```

**Access Redis CLI**:
```bash
docker-compose -f docker-compose.dev.yml exec redis redis-cli -a redis
```

**Run Prisma migrations**:
```bash
docker-compose -f docker-compose.dev.yml exec api npx prisma migrate dev
```

**Stop and remove volumes**:
```bash
docker-compose -f docker-compose.dev.yml down -v
```

### Production

**Start services**:
```bash
docker-compose up -d
```

**View logs**:
```bash
docker-compose logs -f
```

**Scale API instances**:
```bash
docker-compose up -d --scale api=3
```

**Backup database**:
```bash
docker-compose exec postgres pg_dump -U postgres toip_registry > backup.sql
```

**Restore database**:
```bash
docker-compose exec -T postgres psql -U postgres toip_registry < backup.sql
```

---

## 🔍 Health Checks

### API Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-11-24T10:00:00.000Z",
  "uptime": 123.45,
  "database": "connected",
  "redis": "connected"
}
```

### PostgreSQL Health Check
```bash
docker-compose exec postgres pg_isready -U postgres
```

### Redis Health Check
```bash
docker-compose exec redis redis-cli -a redis ping
```

---

## 📊 Monitoring

### View Resource Usage
```bash
docker stats
```

### View Container Status
```bash
docker-compose ps
```

### Inspect Volumes
```bash
docker volume ls
docker volume inspect toip-registry-postgres-data
```

---

## 🐛 Troubleshooting

### Services Won't Start

**Check logs**:
```bash
docker-compose logs
```

**Check port conflicts**:
```bash
lsof -i :3000
lsof -i :5432
lsof -i :6379
```

**Remove old containers**:
```bash
docker-compose down
docker-compose up -d
```

### Database Connection Issues

**Verify PostgreSQL is running**:
```bash
docker-compose ps postgres
```

**Check database logs**:
```bash
docker-compose logs postgres
```

**Test connection**:
```bash
docker-compose exec postgres psql -U postgres -d toip_registry -c "SELECT 1"
```

### Redis Connection Issues

**Verify Redis is running**:
```bash
docker-compose ps redis
```

**Check Redis logs**:
```bash
docker-compose logs redis
```

**Test connection**:
```bash
docker-compose exec redis redis-cli -a redis ping
```

### API Won't Start

**Check dependencies**:
```bash
docker-compose ps
```

**View API logs**:
```bash
docker-compose logs api
```

**Rebuild image**:
```bash
docker-compose build --no-cache api
docker-compose up -d api
```

---

## 🔒 Security Best Practices

### Production Deployment

1. **Change default passwords**:
```bash
# Generate strong passwords
openssl rand -base64 32
```

2. **Use secrets management**:
```bash
# Use Docker secrets or environment variable injection
docker secret create db_password password.txt
```

3. **Enable TLS**:
- Use reverse proxy (nginx/traefik)
- Configure SSL certificates
- Enforce HTTPS

4. **Restrict network access**:
```yaml
networks:
  toip-network:
    driver: bridge
    internal: true  # No external access
```

5. **Regular updates**:
```bash
docker-compose pull
docker-compose up -d
```

---

## 📈 Performance Tuning

### PostgreSQL

**Increase shared buffers** (add to docker-compose.yml):
```yaml
command: postgres -c shared_buffers=256MB -c max_connections=100
```

### Redis

**Increase max memory** (add to docker-compose.yml):
```yaml
command: redis-server --maxmemory 512mb
```

### API

**Increase Node.js memory**:
```yaml
environment:
  NODE_OPTIONS: "--max-old-space-size=2048"
```

---

## 🧹 Cleanup

### Remove All Containers
```bash
docker-compose down
```

### Remove Volumes (⚠️ Data Loss)
```bash
docker-compose down -v
```

### Remove Images
```bash
docker-compose down --rmi all
```

### Full Cleanup
```bash
docker-compose down -v --rmi all
docker system prune -a --volumes
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)

---

## 🆘 Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Review this guide
3. Check GitHub issues
4. Contact technical support

---

**Last Updated**: November 24, 2024  
**Version**: 1.0
