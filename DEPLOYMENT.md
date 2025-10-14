# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **PostgreSQL Database**: Set up a PostgreSQL database (recommended: Vercel Postgres, Neon, or Supabase)

## Step 1: Prepare Your Repository

Your project is already configured for deployment with:
- ✅ Updated Prisma schema for PostgreSQL
- ✅ Vercel configuration file
- ✅ Build scripts updated

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - What's your project's name? inventory-management
# - In which directory is your code located? ./
```

### Option B: Deploy via GitHub Integration
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `prisma generate && prisma db push && next build`
   - **Output Directory**: `.next`

## Step 3: Set Up Database

### Option A: Vercel Postgres (Recommended)
1. In your Vercel project dashboard, go to "Storage"
2. Click "Create Database" → "Postgres"
3. Copy the connection string
4. Add it to your environment variables as `DATABASE_URL`

### Option B: External PostgreSQL Database
Use services like:
- [Neon](https://neon.tech) (Free tier available)
- [Supabase](https://supabase.com) (Free tier available)
- [Railway](https://railway.app) (Free tier available)

## Step 4: Configure Environment Variables

In your Vercel project dashboard, go to "Settings" → "Environment Variables" and add:

### Required Variables:
```
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
NEXTAUTH_SECRET=your-super-secret-nextauth-key-here
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-app-name.vercel.app
```

### Optional Variables (for file uploads):
```
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your-s3-access-key
S3_SECRET_KEY=your-s3-secret-key
S3_BUCKET=your-s3-bucket-name
S3_REGION=us-east-1
```

### Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Step 5: Deploy and Test

1. Trigger a new deployment in Vercel
2. Check the build logs for any errors
3. Once deployed, visit your app URL
4. Test the authentication and basic functionality

## Step 6: Seed the Database (Optional)

If you have seed data, you can run it after deployment:
```bash
# Connect to your production database
npx prisma db seed
```

## Troubleshooting

### Common Issues:

1. **Build Errors**: Check that all dependencies are in `package.json`
2. **Database Connection**: Verify `DATABASE_URL` is correct
3. **Authentication Issues**: Ensure `NEXTAUTH_SECRET` is set
4. **File Upload Issues**: Configure S3 or use local storage

### Useful Commands:
```bash
# Check deployment logs
vercel logs

# View project info
vercel ls

# Open project in browser
vercel open
```

## Post-Deployment

1. **Custom Domain**: Add a custom domain in Vercel dashboard
2. **Monitoring**: Set up monitoring and alerts
3. **Backups**: Configure database backups
4. **Performance**: Monitor performance metrics

## Environment-Specific Notes

- **Development**: Uses SQLite (`./dev.db`)
- **Production**: Uses PostgreSQL (configured via `DATABASE_URL`)
- **File Storage**: Configure S3 for production file uploads
- **Authentication**: NextAuth configured for production
