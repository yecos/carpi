#!/bin/bash
# Build script for Carpi
# Uses SQLite for local dev, PostgreSQL for Vercel

set -e

# Check if we're building for Vercel (DATABASE_URL contains postgresql)
if echo "$DATABASE_URL" | grep -q "postgresql"; then
  echo "🐘 Building for PostgreSQL (Vercel/Neon)..."
  cp prisma/schema.postgresql.prisma prisma/schema.prisma
else
  echo "🗃️  Building for SQLite (local dev)..."
  # Schema is already SQLite by default
fi

# Generate Prisma client
npx prisma generate

# Build Next.js
npx next build
