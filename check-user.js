const { PrismaClient } = require('@prisma/client')
const argon2 = require('argon2')

const prisma = new PrismaClient()

async function checkUser() {
  try {
    console.log('🔍 Checking production database user...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Find the owner user
    const user = await prisma.user.findUnique({
      where: { email: 'owner@inventory.com' }
    })
    
    if (!user) {
      console.log('❌ No user found with email owner@inventory.com')
      return
    }
    
    console.log('👤 User found:')
    console.log(`- ID: ${user.id}`)
    console.log(`- Email: ${user.email}`)
    console.log(`- Name: ${user.name}`)
    console.log(`- Role: ${user.role}`)
    console.log(`- Active: ${user.isActive}`)
    console.log(`- Password hash: ${user.password.substring(0, 20)}...`)
    
    // Test password verification
    const testPasswords = ['admin123', 'owner123', 'password']
    
    for (const password of testPasswords) {
      try {
        const isValid = await argon2.verify(user.password, password)
        console.log(`🔑 Password "${password}": ${isValid ? '✅ VALID' : '❌ INVALID'}`)
      } catch (error) {
        console.log(`🔑 Password "${password}": ❌ ERROR - ${error.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
