const { execSync } = require('child_process')

const newDatabaseUrl = 'postgresql://neondb_owner:npg_BtsL8C9qNUZl@ep-little-feather-aduk9s63-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

try {
  console.log('🔄 Updating DATABASE_URL in Vercel...')
  
  // Remove existing DATABASE_URL
  execSync('npx vercel env rm DATABASE_URL --yes', { stdio: 'inherit' })
  
  // Add new DATABASE_URL
  execSync(`echo "${newDatabaseUrl}" | npx vercel env add DATABASE_URL production`, { stdio: 'inherit' })
  
  console.log('✅ DATABASE_URL updated successfully!')
  console.log('🚀 Redeploying...')
  
  // Redeploy
  execSync('npx vercel --prod', { stdio: 'inherit' })
  
} catch (error) {
  console.error('❌ Error:', error.message)
}
