#!/bin/sh
set -e

echo "🚀 Starting Trust Registry API..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until nc -z postgres 5432; do
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
