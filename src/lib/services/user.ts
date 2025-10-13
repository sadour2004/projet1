import { db } from '@/lib/db'
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserQuery,
} from '@/lib/validators/user'
import { createAuditLog, AuditAction, AuditEntity } from './audit'
import { logger } from '@/lib/logger'
import * as argon2 from 'argon2'
import { Prisma } from '@prisma/client'

export async function createUser(data: CreateUserRequest, actorId: string) {
  try {
    // Check for existing email
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    })
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Generate password if not provided
    const password = data.password || generateRandomPassword()
    const hashedPassword = await argon2.hash(password)

    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        isActive: data.isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Audit log
    await createAuditLog({
      actorId,
      action: AuditAction.USER_CREATE,
      entity: AuditEntity.USER,
      entityId: user.id,
      meta: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })

    logger.info('User created', { userId: user.id, actorId, role: user.role })
    return { user, password: data.password ? undefined : password }
  } catch (error) {
    logger.error('Failed to create user', { error, actorId })
    throw error
  }
}

export async function updateUser(data: UpdateUserRequest, actorId: string) {
  try {
    const { id, ...updateData } = data

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    })
    if (!existingUser) {
      throw new Error('User not found')
    }

    // Check for email uniqueness (excluding current user)
    if (data.email && data.email !== existingUser.email) {
      const existingEmail = await db.user.findUnique({
        where: { email: data.email },
      })
      if (existingEmail) {
        throw new Error('User with this email already exists')
      }
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Audit log
    await createAuditLog({
      actorId,
      action: AuditAction.USER_UPDATE,
      entity: AuditEntity.USER,
      entityId: id,
      meta: {
        changes: updateData,
      },
    })

    logger.info('User updated', { userId: id, actorId })
    return user
  } catch (error) {
    logger.error('Failed to update user', { error, userId: data.id, actorId })
    throw error
  }
}

export async function changeUserPassword(
  userId: string,
  newPassword: string,
  actorId: string
) {
  try {
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    })
    if (!existingUser) {
      throw new Error('User not found')
    }

    const hashedPassword = await argon2.hash(newPassword)

    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    // Audit log
    await createAuditLog({
      actorId,
      action: AuditAction.USER_PASSWORD_CHANGE,
      entity: AuditEntity.USER,
      entityId: userId,
      meta: {
        changedBy: actorId,
      },
    })

    logger.info('User password changed', { userId, actorId })
  } catch (error) {
    logger.error('Failed to change user password', { error, userId, actorId })
    throw error
  }
}

export async function resetUserPassword(userId: string, actorId: string) {
  try {
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    })
    if (!existingUser) {
      throw new Error('User not found')
    }

    const newPassword = generateRandomPassword()
    const hashedPassword = await argon2.hash(newPassword)

    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    // Audit log
    await createAuditLog({
      actorId,
      action: AuditAction.USER_PASSWORD_RESET,
      entity: AuditEntity.USER,
      entityId: userId,
      meta: {
        resetBy: actorId,
      },
    })

    logger.info('User password reset', { userId, actorId })
    return { newPassword }
  } catch (error) {
    logger.error('Failed to reset user password', { error, userId, actorId })
    throw error
  }
}

export async function deleteUser(userId: string, actorId: string) {
  try {
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    })
    if (!existingUser) {
      throw new Error('User not found')
    }

    // Prevent owner from being deleted
    if (existingUser.role === 'OWNER') {
      throw new Error('Cannot delete owner account')
    }

    await db.user.delete({
      where: { id: userId },
    })

    // Audit log
    await createAuditLog({
      actorId,
      action: AuditAction.USER_DELETE,
      entity: AuditEntity.USER,
      entityId: userId,
      meta: {
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
      },
    })

    logger.info('User deleted', { userId, actorId })
  } catch (error) {
    logger.error('Failed to delete user', { error, userId, actorId })
    throw error
  }
}

export async function getUsers(query: UserQuery) {
  try {
    const { search, role, limit = 20, cursor } = query

    const where: Prisma.UserWhereInput = {
      role: 'STAFF', // Only show STAFF users to owner
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }

    if (role) {
      where.role = role
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            movements: true,
            auditLogs: true,
          },
        },
      },
      take: limit + 1, // Fetch one more to check if there's a next page
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    })

    const hasMore = users.length > limit
    const data = hasMore ? users.slice(0, limit) : users
    const nextCursor = hasMore ? data[data.length - 1].id : null

    return { users: data, hasMore, nextCursor }
  } catch (error) {
    logger.error('Failed to get users', { error, query })
    throw error
  }
}

export async function getUserById(id: string) {
  try {
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  } catch (error) {
    logger.error('Failed to get user', { error, userId: id })
    throw error
  }
}

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
