#!/bin/sh
set -e

echo "🚀 Starting SellMatic application..."

# Wait for PostgreSQL to be ready
until pg_isready -h postgres -U postgres > /dev/null 2>&1; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 1
done

echo "✅ PostgreSQL is ready"

# Run Prisma migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Optional: Seed the database (uncomment if you want auto-seeding)
# echo "🌱 Seeding database..."
# npm run seed

echo "✨ Setup complete! Starting application..."
node dist/index.js
