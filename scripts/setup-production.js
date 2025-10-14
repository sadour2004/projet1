const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function setupProduction() {
  try {
    console.log('🚀 Setting up production database...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Create owner user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const owner = await prisma.user.upsert({
      where: { email: 'owner@inventory.com' },
      update: {},
      create: {
        email: 'owner@inventory.com',
        name: 'System Owner',
        password: hashedPassword,
        role: 'OWNER',
        isActive: true,
        dateOfBirth: '1990-01-01'
      }
    })
    
    console.log('✅ Owner user created/verified')
    console.log(`📧 Email: ${owner.email}`)
    console.log(`🔑 Password: admin123`)
    
    // Create some sample categories
    const categories = [
      { name: 'Electronics', slug: 'electronics' },
      { name: 'Clothing', slug: 'clothing' },
      { name: 'Books', slug: 'books' }
    ]
    
    for (const category of categories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: {},
        create: category
      })
    }
    
    console.log('✅ Sample categories created')
    console.log('🎉 Production database setup complete!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupProduction()
