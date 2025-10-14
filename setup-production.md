# Production Database Setup

## Option 1: Neon (Recommended - Free PostgreSQL)

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project
4. Copy the connection string (it will look like: `postgresql://username:password@hostname/database?sslmode=require`)
5. Set this as `DATABASE_URL` in your Vercel environment variables

## Option 2: Vercel Postgres (Built-in)

1. Go to your Vercel dashboard
2. Navigate to your project
3. Go to Storage tab
4. Create a new Postgres database
5. Copy the connection string

## Option 3: Supabase (Free PostgreSQL)

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string

## Environment Variables to Set in Vercel:

1. `DATABASE_URL` - Your PostgreSQL connection string
2. `NEXTAUTH_URL` - Your production URL (e.g., https://your-app.vercel.app)
3. `NEXTAUTH_SECRET` - A random secret string (generate with: `openssl rand -base64 32`)

## After Setting Up Database:

1. Run `npx prisma db push` to create tables
2. Run `npx prisma db seed` to add initial data
3. Redeploy your application
