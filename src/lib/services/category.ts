import { db } from '@/lib/db'
import {
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/lib/validators/category'
import { createAuditLog, AuditAction, AuditEntity } from './audit'
import { logger } from '@/lib/logger'

export async function createCategory(
  data: CreateCategoryRequest,
  actorId: string
) {
  try {
    // Check for unique constraints
    const existingName = await db.category.findUnique({
      where: { name: data.name },
    })
    if (existingName) {
      throw new Error('Category with this name already exists')
    }

    const existingSlug = await db.category.findUnique({
      where: { slug: data.slug },
    })
    if (existingSlug) {
      throw new Error('Category with this slug already exists')
    }

    const category = await db.category.create({
      data,
      include: {
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
                isArchived: false,
              },
            },
          },
        },
      },
    })

    // Audit log
    await createAuditLog({
      actorId,
      action: AuditAction.CATEGORY_CREATE,
      entity: AuditEntity.CATEGORY,
      entityId: category.id,
      meta: {
        name: category.name,
        slug: category.slug,
      },
    })

    logger.info('Category created', { categoryId: category.id, actorId })
    return category
  } catch (error) {
    logger.error('Failed to create category', { error, actorId })
    throw error
  }
}

export async function updateCategory(
  data: UpdateCategoryRequest,
  actorId: string
) {
  try {
    const { id, ...updateData } = data

    // Check if category exists
    const existingCategory = await db.category.findUnique({
      where: { id },
    })
    if (!existingCategory) {
      throw new Error('Category not found')
    }

    // Check for unique constraints (excluding current category)
    if (data.name && data.name !== existingCategory.name) {
      const existingName = await db.category.findUnique({
        where: { name: data.name },
      })
      if (existingName) {
        throw new Error('Category with this name already exists')
      }
    }

    if (data.slug && data.slug !== existingCategory.slug) {
      const existingSlug = await db.category.findUnique({
        where: { slug: data.slug },
      })
      if (existingSlug) {
        throw new Error('Category with this slug already exists')
      }
    }

    const category = await db.category.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
                isArchived: false,
              },
            },
          },
        },
      },
    })

    // Audit log
    await createAuditLog({
      actorId,
      action: AuditAction.CATEGORY_UPDATE,
      entity: AuditEntity.CATEGORY,
      entityId: id,
      meta: {
        changes: updateData,
      },
    })

    logger.info('Category updated', { categoryId: id, actorId })
    return category
  } catch (error) {
    logger.error('Failed to update category', {
      error,
      categoryId: data.id,
      actorId,
    })
    throw error
  }
}

export async function deleteCategory(id: string, actorId: string) {
  try {
    const category = await db.$transaction(async (tx) => {
      // Check if category exists
      const existingCategory = await tx.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              products: {
                where: {
                  isActive: true,
                  isArchived: false,
                },
              },
            },
          },
        },
      })
      if (!existingCategory) {
        throw new Error('Category not found')
      }

      // Check if category has products
      if (existingCategory._count.products > 0) {
        throw new Error(
          'Cannot delete category with products. Remove products first.'
        )
      }

      // Delete category
      const deletedCategory = await tx.category.delete({
        where: { id },
      })

      return deletedCategory
    })

    // Audit log
    await createAuditLog({
      actorId,
      action: AuditAction.CATEGORY_DELETE,
      entity: AuditEntity.CATEGORY,
      entityId: id,
      meta: {
        name: category.name,
        slug: category.slug,
      },
    })

    logger.info('Category deleted', { categoryId: id, actorId })
    return category
  } catch (error) {
    logger.error('Failed to delete category', {
      error,
      categoryId: id,
      actorId,
    })
    throw error
  }
}

export async function getCategories() {
  try {
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
                isArchived: false,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return categories
  } catch (error) {
    logger.error('Failed to get categories', { error })
    throw error
  }
}

export async function getCategoryById(id: string) {
  try {
    const category = await db.category.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            images: {
              orderBy: { priority: 'desc' },
              take: 1,
            },
          },
          where: {
            isActive: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
                isArchived: false,
              },
            },
          },
        },
      },
    })

    if (!category) {
      throw new Error('Category not found')
    }

    return category
  } catch (error) {
    logger.error('Failed to get category', { error, categoryId: id })
    throw error
  }
}
