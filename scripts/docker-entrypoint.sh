#!/bin/sh
set -e

echo "🚀 Starting Trust Registry API..."

# Resolve DB host/port from DATABASE_URL to support overrides
DB_WAIT_HOST="postgres"
DB_WAIT_PORT="5432"

if [ -n "$DATABASE_URL" ]; then
  DB_WAIT_HOST=$(node -e "try { const u = new URL(process.env.DATABASE_URL); console.log(u.hostname || 'postgres'); } catch (e) { console.log('postgres'); }")
  DB_WAIT_PORT=$(node -e "try { const u = new URL(process.env.DATABASE_URL); console.log(u.port || '5432'); } catch (e) { console.log('5432'); }")
fi

echo "⏳ Waiting for PostgreSQL at ${DB_WAIT_HOST}:${DB_WAIT_PORT}..."
until nc -z "$DB_WAIT_HOST" "$DB_WAIT_PORT"; do
  echo "   PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run Prisma migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma Client (in case it's not generated)
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run database seed
echo "🌱 Seeding database..."
npx ts-node prisma/seed.ts || echo "⚠️  Seed failed or already seeded"

echo "✅ Database setup complete!"

# Start the application
echo "🎉 Starting application..."
exec "$@"
