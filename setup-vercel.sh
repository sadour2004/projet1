#!/bin/bash

# Vercel Deployment Setup Script
echo "🚀 Setting up Vercel deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel (if not already logged in)
echo "🔐 Logging into Vercel..."
vercel login

# Deploy the project
echo "📦 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Set up environment variables:"
echo "   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
echo "   - NEXTAUTH_URL (your Vercel app URL)"
echo "   - DATABASE_URL (PostgreSQL connection string)"
echo "   - NEXT_PUBLIC_SITE_URL (your Vercel app URL)"
echo "3. Set up a PostgreSQL database (Vercel Postgres recommended)"
echo "4. Run database migrations: npx prisma db push"
echo "5. Seed the database if needed: npx prisma db seed"
