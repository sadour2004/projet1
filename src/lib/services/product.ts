import { db } from '@/lib/db'
import {
  CreateProductRequest,
  UpdateProductRequest,
  ProductQuery,
} from '@/lib/validators/product'
import { createAuditLog, AuditAction, AuditEntity } from './audit'
import { logger } from '@/lib/logger'
import { Prisma } from '@prisma/client'

export async function createProduct(
  data: CreateProductRequest,
  actorId: string
) {
  try {
    const { images, ...productData } = data

    const product = await db.$transaction(async (tx) => {
      // Check for unique constraints
      const existingSlug = await tx.product.findUnique({
        where: { slug: data.slug },
      })
      if (existingSlug) {
        throw new Error('Product with this slug already exists')
      }

      if (data.sku) {
        const existingSku = await tx.product.findUnique({
          where: { sku: data.sku },
        })
        if (existingSku) {
          throw new Error('Product with this SKU already exists')
        }
      }

      // Create product
      const newProduct = await tx.product.create({
        data: {
          ...productData,
          images: {
            create: images,
          },
        },
        include: {
          images: true,
          category: true,
        },
      })

      return newProduct
    })

    // Audit log
    await createAuditLog({
      actorId,
      action: AuditAction.PRODUCT_CREATE,
      entity: AuditEntity.PRODUCT,
      entityId: product.id,
      meta: {
        name: product.name,
        sku: product.sku,
        priceCents: product.priceCents,
      },
    })

    logger.info('Product created', { productId: product.id, actorId })
    return product
  } catch (error) {
    logger.error('Failed to create product', { error, actorId })
    throw error
  }
}

export async function updateProduct(
  data: UpdateProductRequest,
  actorId: string
) {
  try {
    const { id, images, ...productData } = data

    const product = await db.$transaction(async (tx) => {
      // Check if product exists
      const existingProduct = await tx.product.findUnique({
        where: { id },
        include: { images: true },
      })
      if (!existingProduct) {
        throw new Error('Product not found')
      }

      // Check for unique constraints (excluding current product)
      if (data.slug && data.slug !== existingProduct.slug) {
        const existingSlug = await tx.product.findUnique({
          where: { slug: data.slug },
        })
        if (existingSlug) {
          throw new Error('Product with this slug already exists')
        }
      }

      if (data.sku && data.sku !== existingProduct.sku) {
        const existingSku = await tx.product.findUnique({
          where: { sku: data.sku },
        })
        if (existingSku) {
          throw new Error('Product with this SKU already exists')
        }
      }

      // Update product
      const updatedProduct = await tx.product.update({
        where: { id },
        data: productData,
        include: {
          images: true,
          category: true,
        },
      })

      // Update images if provided
      if (images) {
        // Delete existing images
        await tx.productImage.deleteMany({
          where: { productId: id },
        })

        // Create new images
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img) => ({
              ...img,
              productId: id,
            })),
          })
        }
      }

      return updatedProduct
    })

    // Audit log
    await createAuditLog({
      actorId,
      action: AuditAction.PRODUCT_UPDATE,
      entity: AuditEntity.PRODUCT,
      entityId: product.id,
      meta: {
        changes: productData,
      },
    })

    logger.info('Product updated', { productId: product.id, actorId })
    return product
  } catch (error) {
    logger.error('Failed to update product', {
      error,
      productId: data.id,
      actorId,
    })
    throw error
  }
}

export async function deleteProduct(id: string, actorId: string) {
  try {
    const product = await db.$transaction(async (tx) => {
      // Check if product exists
      const existingProduct = await tx.product.findUnique({
        where: { id },
        include: {
          movements: true,
        },
      })
      if (!existingProduct) {
        throw new Error('Product not found')
      }

      // Check if already archived
      if (existingProduct.isArchived) {
        throw new Error('Product is already archived')
      }

      // Soft delete: Mark as archived instead of deleting
      // This preserves all movements, sales history, and relationships
      const archivedProduct = await tx.product.update({
        where: { id },
        data: {
          isArchived: true,
          isActive: false, // Also mark as inactive
        },
        include: {
          images: true,
          category: true,
          movements: true, // Include movements for audit log
        },
      })

      // Create an archive record for additional backup
      await tx.productArchive.create({
        data: {
          originalId: existingProduct.id,
          name: existingProduct.name,
          description: existingProduct.description,
          sku: existingProduct.sku,
          priceCents: existingProduct.priceCents,
          currency: existingProduct.currency,
          categoryId: existingProduct.categoryId,
          isActive: false,
          stockCached: existingProduct.stockCached,
          archivedAt: new Date(),
          archivedBy: actorId,
          movementCount: existingProduct.movements.length,
        },
      })

      return archivedProduct
    })

    // Audit log (using existingProduct which has movements loaded)
    await createAuditLog({
      actorId,
      action: AuditAction.PRODUCT_DELETE,
      entity: AuditEntity.PRODUCT,
      entityId: id,
      meta: {
        name: product.name,
        sku: product.sku,
        movementCount: product.movements.length,
        softDelete: true,
      },
    })

    logger.info('Product archived (soft delete)', {
      productId: id,
      actorId,
      movementCount: product.movements.length,
    })
    return product
  } catch (error) {
    logger.error('Failed to archive product', { error, productId: id, actorId })
    throw error
  }
}

export async function getProducts(query: ProductQuery) {
  try {
    const where: Prisma.ProductWhereInput = {}

    // Exclude archived products (soft deleted)
    where.isArchived = false

    // Search filter
    if (query.q) {
      where.OR = [
        { name: { contains: query.q } },
        { sku: { contains: query.q } },
        { description: { contains: query.q } },
      ]
    }

    // Category filter
    if (query.category) {
      where.categoryId = query.category
    }

    // Active filter
    if (query.isActive !== undefined) {
      where.isActive = query.isActive
    }

    // Cursor pagination
    const cursorCondition = query.cursor ? { id: query.cursor } : undefined

    const products = await db.product.findMany({
      where,
      include: {
        images: {
          orderBy: { priority: 'desc' },
        },
        category: true,
        _count: {
          select: {
            movements: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1, // Take one extra to check if there are more
      cursor: cursorCondition ? { id: cursorCondition.id } : undefined,
      skip: cursorCondition ? 1 : 0, // Skip the cursor item
    })

    // Check if there are more items
    const hasMore = products.length > query.limit
    if (hasMore) {
      products.pop() // Remove the extra item
    }

    const nextCursor = hasMore ? products[products.length - 1]?.id : null

    return {
      products,
      hasMore,
      nextCursor,
    }
  } catch (error) {
    logger.error('Failed to get products', { error, query })
    throw error
  }
}

export async function getProductById(id: string) {
  try {
    const product = await db.product.findFirst({
      where: { 
        id,
        isArchived: false, // Exclude archived products
      },
      include: {
        images: {
          orderBy: { priority: 'desc' },
        },
        category: true,
        movements: {
          include: {
            actor: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Recent movements
        },
      },
    })

    if (!product) {
      throw new Error('Product not found')
    }

    return product
  } catch (error) {
    logger.error('Failed to get product', { error, productId: id })
    throw error
  }
}

export async function toggleProductStatus(id: string, actorId: string) {
  try {
    const product = await db.product.findUnique({
      where: { id },
    })

    if (!product) {
      throw new Error('Product not found')
    }

    const updatedProduct = await db.product.update({
      where: { id },
      data: {
        isActive: !product.isActive,
      },
    })

    // Audit log
    await createAuditLog({
      actorId,
      action: updatedProduct.isActive
        ? AuditAction.PRODUCT_ACTIVATE
        : AuditAction.PRODUCT_DEACTIVATE,
      entity: AuditEntity.PRODUCT,
      entityId: id,
      meta: {
        name: product.name,
        previousStatus: product.isActive,
        newStatus: updatedProduct.isActive,
      },
    })

    logger.info('Product status toggled', {
      productId: id,
      actorId,
      newStatus: updatedProduct.isActive,
    })

    return updatedProduct
  } catch (error) {
    logger.error('Failed to toggle product status', {
      error,
      productId: id,
      actorId,
    })
    throw error
  }
}
