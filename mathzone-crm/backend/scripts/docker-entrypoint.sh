#!/bin/sh
set -e

echo "🔧 Waiting for PostgreSQL to be ready..."
until npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; do
  echo "Waiting for database..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npm run seed || echo "⚠️  Seed failed (data may already exist)"

echo "🚀 Starting application..."
exec "$@"
