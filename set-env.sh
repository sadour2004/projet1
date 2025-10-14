#!/bin/bash

# Set environment variables for Vercel deployment

# Database URL (your Neon PostgreSQL connection string)
echo "postgresql://neondb_owner:npg_BtsL8C9qNUZl@ep-little-feather-aduk9s63-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" | npx vercel env add DATABASE_URL production

# NextAuth Secret (the one we generated earlier)
echo "Ll5IZK6o63ugGBtPPWSSpRojHMruHoRPlwOxLzuH0/0=" | npx vercel env add NEXTAUTH_SECRET production

# NextAuth URL (your production URL)
echo "https://inventory-management-system-sadours-projects.vercel.app" | npx vercel env add NEXTAUTH_URL production

# Public Site URL
echo "https://inventory-management-system-sadours-projects.vercel.app" | npx vercel env add NEXT_PUBLIC_SITE_URL production

echo "Environment variables set successfully!"
