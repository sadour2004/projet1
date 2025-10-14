const { PrismaClient } = require('@prisma/client')
const argon2 = require('argon2')

const prisma = new PrismaClient()

async function fixUser() {
  try {
    console.log('🔧 Fixing user password...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Hash the correct password
    const hashedPassword = await argon2.hash('admin123')
    
    // Update the user with the correct password
    const updatedUser = await prisma.user.update({
      where: { email: 'owner@inventory.com' },
      data: {
        password: hashedPassword,
        name: 'System Owner'
      }
    })
    
    console.log('✅ User updated successfully!')
    console.log(`📧 Email: ${updatedUser.email}`)
    console.log(`👤 Name: ${updatedUser.name}`)
    console.log(`🔑 Password: admin123`)
    console.log(`🎭 Role: ${updatedUser.role}`)
    
    // Verify the password works
    const isValid = await argon2.verify(updatedUser.password, 'admin123')
    console.log(`✅ Password verification: ${isValid ? 'SUCCESS' : 'FAILED'}`)
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixUser()
