#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Setting up Vercel environment variables...');

// Generate a secure NEXTAUTH_SECRET
const nextAuthSecret = 'P2ddjCKXUUZveEImlPn2BDggUxqGKMd3X//XH0vd/vE=';
const nextAuthUrl = 'https://inventory-management-system-coral-two.vercel.app';

console.log('📝 Environment variables to set:');
console.log(`NEXTAUTH_SECRET=${nextAuthSecret}`);
console.log(`NEXTAUTH_URL=${nextAuthUrl}`);

console.log('\n🔧 Setting environment variables in Vercel...');

try {
  // Set NEXTAUTH_SECRET
  execSync(`npx vercel env add NEXTAUTH_SECRET production`, {
    input: nextAuthSecret,
    stdio: 'pipe'
  });
  console.log('✅ NEXTAUTH_SECRET set');

  // Set NEXTAUTH_URL
  execSync(`npx vercel env add NEXTAUTH_URL production`, {
    input: nextAuthUrl,
    stdio: 'pipe'
  });
  console.log('✅ NEXTAUTH_URL set');

  console.log('\n🚀 Redeploying with new environment variables...');
  execSync('npx vercel --prod', { stdio: 'inherit' });

  console.log('\n✅ Deployment complete!');
  console.log('🔗 Your website should now work with authentication:');
  console.log('   https://inventory-management-system-coral-two.vercel.app');
  console.log('\n🔑 Login credentials:');
  console.log('   Email: owner@inventory.com');
  console.log('   Password: admin123');

} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n📋 Manual setup instructions:');
  console.log('1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
  console.log('2. Add these variables:');
  console.log(`   NEXTAUTH_SECRET = ${nextAuthSecret}`);
  console.log(`   NEXTAUTH_URL = ${nextAuthUrl}`);
  console.log('3. Redeploy the application');
}
