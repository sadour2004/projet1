import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    
    console.log('Testing login for:', email)
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      console.log('User not found:', email)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    console.log('User found:', user.email, 'Active:', user.isActive)
    
    if (!user.isActive) {
      console.log('User inactive:', email)
      return NextResponse.json({ error: 'User inactive' }, { status: 403 })
    }
    
    // Verify password
    const isValidPassword = await argon2.verify(user.password, password)
    console.log('Password valid:', isValidPassword)
    
    if (!isValidPassword) {
      console.log('Invalid password for:', email)
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }
    
    // Return success
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      }
    })
    
  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Test login endpoint - use POST with email and password' })
}
