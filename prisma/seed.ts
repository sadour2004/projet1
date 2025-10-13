import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create users
  const ownerPassword = await argon2.hash('owner123')
  const staffPassword = await argon2.hash('staff123')
  const owner = await prisma.user.upsert({
    where: { email: 'owner@inventory.com' },
    update: {},
    create: {
      email: 'owner@inventory.com',
      name: 'Propriétaire Principal',
      password: ownerPassword,
      role: 'OWNER',
      dateOfBirth: '1990-01-01', // Date de naissance pour test de réinitialisation
    },
  })

  const staff = await prisma.user.upsert({
    where: { email: 'staff@inventory.com' },
    update: {},
    create: {
      email: 'staff@inventory.com',
      name: 'Personnel de Vente',
      password: staffPassword,
      role: 'STAFF',
      dateOfBirth: '1995-05-15', // Date de naissance pour test de réinitialisation
    },
  })

  console.log('👥 Created users')

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'electronics' },
      update: {},
      create: {
        name: 'Electronics',
        slug: 'electronics',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'clothing' },
      update: {},
      create: {
        name: 'Clothing',
        slug: 'clothing',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'books' },
      update: {},
      create: {
        name: 'Books',
        slug: 'books',
      },
    }),
  ])

  console.log('📂 Created categories')

  // Create products with images
  const products = [
    {
      name: 'Laptop Pro 15"',
      slug: 'laptop-pro-15',
      description: 'High-performance laptop for professionals',
      sku: 'LAP-PRO-15',
      priceCents: 149999,
      categoryId: categories[0].id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop',
          alt: 'Laptop Pro 15\"',
          priority: 1,
        },
      ],
    },
    {
      name: 'Wireless Headphones',
      slug: 'wireless-headphones',
      description: 'Premium noise-cancelling headphones',
      sku: 'HEAD-WL-001',
      priceCents: 29999,
      categoryId: categories[0].id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
          alt: 'Wireless Headphones',
          priority: 1,
        },
      ],
    },
    {
      name: 'Smartphone X',
      slug: 'smartphone-x',
      description: 'Latest flagship smartphone',
      sku: 'PHONE-X-001',
      priceCents: 79999,
      categoryId: categories[0].id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
          alt: 'Smartphone X',
          priority: 1,
        },
      ],
    },
    {
      name: 'Cotton T-Shirt',
      slug: 'cotton-t-shirt',
      description: '100% organic cotton t-shirt',
      sku: 'SHIRT-COT-001',
      priceCents: 2999,
      categoryId: categories[1].id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
          alt: 'Cotton T-Shirt',
          priority: 1,
        },
      ],
    },
    {
      name: 'Denim Jeans',
      slug: 'denim-jeans',
      description: 'Classic blue denim jeans',
      sku: 'JEANS-DEN-001',
      priceCents: 6999,
      categoryId: categories[1].id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
          alt: 'Denim Jeans',
          priority: 1,
        },
      ],
    },
    {
      name: 'Winter Jacket',
      slug: 'winter-jacket',
      description: 'Warm winter jacket for cold weather',
      sku: 'JACK-WIN-001',
      priceCents: 12999,
      categoryId: categories[1].id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400&h=400&fit=crop',
          alt: 'Winter Jacket',
          priority: 1,
        },
      ],
    },
    {
      name: 'Programming Guide',
      slug: 'programming-guide',
      description: 'Complete guide to modern programming',
      sku: 'BOOK-PROG-001',
      priceCents: 4999,
      categoryId: categories[2].id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop',
          alt: 'Programming Guide',
          priority: 1,
        },
      ],
    },
    {
      name: 'Design Principles',
      slug: 'design-principles',
      description: 'Essential design principles for creators',
      sku: 'BOOK-DES-001',
      priceCents: 3999,
      categoryId: categories[2].id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop',
          alt: 'Design Principles',
          priority: 1,
        },
      ],
    },
    {
      name: 'Business Strategy',
      slug: 'business-strategy',
      description: 'Modern business strategy handbook',
      sku: 'BOOK-BUS-001',
      priceCents: 5999,
      categoryId: categories[2].id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
          alt: 'Business Strategy',
          priority: 1,
        },
      ],
    },
    {
      name: 'Tablet Pro',
      slug: 'tablet-pro',
      description: 'Professional tablet for creative work',
      sku: 'TAB-PRO-001',
      priceCents: 59999,
      categoryId: categories[0].id,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop',
          alt: 'Tablet Pro',
          priority: 1,
        },
      ],
    },
  ]

  const createdProducts = []
  for (const productData of products) {
    const { images, ...productInfo } = productData
    const product = await prisma.product.upsert({
      where: { sku: productInfo.sku },
      update: {},
      create: {
        ...productInfo,
        images: {
          create: images,
        },
      },
    })
    createdProducts.push(product)
  }

  console.log('📦 Created products with images')

  // Create initial inventory movements to set stock levels
  const movements = []
  for (const product of createdProducts) {
    const initialStock = Math.floor(Math.random() * 100) + 10 // 10-109 items

    const movement = await prisma.inventoryMovement.create({
      data: {
        productId: product.id,
        type: 'ADJUSTMENT',
        qty: initialStock,
        unitPriceCents: product.priceCents,
        note: 'Initial stock setup',
        actorId: owner.id,
      },
    })
    movements.push(movement)

    // Update cached stock
    await prisma.product.update({
      where: { id: product.id },
      data: { stockCached: initialStock },
    })
  }

  console.log('📊 Created initial inventory movements')

  // Add some sample sales movements
  for (let i = 0; i < 20; i++) {
    const randomProduct =
      createdProducts[Math.floor(Math.random() * createdProducts.length)]
    const saleQty = Math.floor(Math.random() * 5) + 1 // 1-5 items

    // Check if we have enough stock
    const currentProduct = await prisma.product.findUnique({
      where: { id: randomProduct.id },
    })

    if (currentProduct && currentProduct.stockCached >= saleQty) {
      await prisma.inventoryMovement.create({
        data: {
          productId: randomProduct.id,
          type: 'SALE_OFFLINE',
          qty: -saleQty, // negative for sales
          unitPriceCents: randomProduct.priceCents,
          note: `Sale #${i + 1}`,
          actorId: staff.id,
        },
      })

      // Update cached stock
      await prisma.product.update({
        where: { id: randomProduct.id },
        data: {
          stockCached: currentProduct.stockCached - saleQty,
        },
      })
    }
  }

  console.log('💰 Created sample sales movements')

  // Verify stock consistency
  const allProducts = await prisma.product.findMany({
    include: {
      movements: true,
    },
  })

  for (const product of allProducts) {
    const calculatedStock = product.movements.reduce(
      (sum, movement) => sum + movement.qty,
      0
    )
    if (calculatedStock !== product.stockCached) {
      console.warn(
        `⚠️  Stock mismatch for ${product.name}: cached=${product.stockCached}, calculated=${calculatedStock}`
      )

      // Fix the mismatch
      await prisma.product.update({
        where: { id: product.id },
        data: { stockCached: calculatedStock },
      })
    }
  }

  console.log('✅ Verified stock consistency')

  // Create audit logs for the seed operations
  await prisma.auditLog.create({
    data: {
      actorId: owner.id,
      action: 'SEED_DATABASE',
      entity: 'SYSTEM',
      meta: JSON.stringify({
        usersCreated: 3,
        categoriesCreated: 3,
        productsCreated: products.length,
        movementsCreated: movements.length + 20,
      }),
    },
  })

  console.log('📝 Created audit log entry')
  console.log('🎉 Seed completed successfully!')

  console.log('\n📋 Comptes de test:')
  console.log('Propriétaire: owner@inventory.com / owner123 (DOB: 1990-01-01)')
  console.log('Personnel: staff@inventory.com / staff123 (DOB: 1995-05-15)')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
