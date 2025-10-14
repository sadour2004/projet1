import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
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
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database setup complete!',
      owner: {
        email: owner.email,
        password: 'admin123'
      }
    })
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
