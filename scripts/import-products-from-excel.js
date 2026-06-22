#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const XLSX = require("xlsx")
const { PrismaClient } = require("@prisma/client")

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") })

const prisma = new PrismaClient()

const ROOT_DIR = path.resolve(__dirname, "..", "..")
const APP_DIR = path.resolve(__dirname, "..")
const WORKBOOK_CANDIDATES = [
  path.join(ROOT_DIR, "Uyarvom_Products_With_Images.xlsx"),
  path.join(ROOT_DIR, "Uyarvom_Products_Updated.xlsx"),
]
const EXTRACTED_IMAGES_DIR = path.join(ROOT_DIR, "extracted_images")
const CATEGORY_IMAGES_DIR = path.join(ROOT_DIR, "source_images", "category_images")
const PUBLIC_CATALOG_DIR = path.join(APP_DIR, "public", "uploads", "catalog")
const PUBLIC_CATEGORY_DIR = path.join(APP_DIR, "public", "uploads", "categories")

const ROOT_CATEGORY_META = {
  COOKWARE: {
    description: "Durable kitchen essentials curated for Indian cooking traditions.",
    imageFile: "Cookware.png",
    displayOrder: 1,
  },
  SERVEWARE: {
    description: "Serving pieces designed to elevate hosting, plating, and shared meals.",
    imageFile: "Serveware.png",
    displayOrder: 2,
  },
  DININGWARE: {
    description: "Elegant dining collections for everyday meals and special occasions.",
    imageFile: "Dinnerware.png",
    displayOrder: 3,
  },
  STORAGE: {
    description: "Functional storage solutions for kitchens, pantries, and organized living.",
    imageFile: null,
    displayOrder: 4,
  },
  "GIFTING SETS": {
    description: "Thoughtful gift-ready collections for celebrations, weddings, and festive moments.",
    imageFile: null,
    displayOrder: 5,
  },
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

function inferSubCategoryName(productName) {
  const name = cleanText(productName)
  if (!name) return null

  if (/\bgift\s+(set|box)\b/i.test(name)) {
    return "Gift Sets"
  }

  return name
    .split(/[–—]/)[0]
    .replace(/\([^)]*\)/g, "")
    .replace(/\b\d+(\.\d+)?\s*(ml|l|ltr|litre|liter|cm|mm|inch|in|pcs?|piece|cavity)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim() || name
}

function cleanText(value) {
  const text = String(value ?? "").trim()
  return text || null
}

function parseCurrency(value) {
  const digits = String(value ?? "")
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "")
    .trim()

  if (!digits) return 0

  const parsed = Number(digits)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseInteger(value) {
  const digits = String(value ?? "")
    .replace(/,/g, "")
    .match(/\d+/)

  if (!digits) return null

  const parsed = Number(digits[0])
  return Number.isFinite(parsed) ? parsed : null
}

function resolveWorkbookPath() {
  for (const candidate of WORKBOOK_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return null
}

function resolveWorkbookImage(imageField) {
  const relativePath = cleanText(imageField)
  if (!relativePath) return null

  const normalized = relativePath.replace(/\//g, path.sep).replace(/\\/g, path.sep)
  const absolutePath = path.join(ROOT_DIR, normalized)

  if (fs.existsSync(absolutePath)) {
    return absolutePath
  }

  const fallbackPath = path.join(EXTRACTED_IMAGES_DIR, path.basename(normalized))
  return fs.existsSync(fallbackPath) ? fallbackPath : null
}

function copyProductImage(sourcePath, sku) {
  if (!sourcePath) return null

  ensureDir(PUBLIC_CATALOG_DIR)

  const extension = path.extname(sourcePath) || ".jpg"
  const safeFileName = `${slugify(sku) || `product-${Date.now()}`}${extension.toLowerCase()}`
  const destinationPath = path.join(PUBLIC_CATALOG_DIR, safeFileName)

  fs.copyFileSync(sourcePath, destinationPath)

  return `/uploads/catalog/${safeFileName}`
}

function copyCategoryImage(fileName) {
  if (!fileName) return null

  const sourcePath = path.join(CATEGORY_IMAGES_DIR, fileName)
  if (!fs.existsSync(sourcePath)) {
    return null
  }

  ensureDir(PUBLIC_CATEGORY_DIR)

  const destinationPath = path.join(PUBLIC_CATEGORY_DIR, fileName)
  fs.copyFileSync(sourcePath, destinationPath)

  return `/uploads/categories/${fileName}`
}

async function resolveProductSlug(name, sku, existingProductId) {
  const baseSlug = slugify(name) || slugify(sku) || `product-${Date.now()}`
  let candidate = baseSlug
  let counter = 2

  while (true) {
    const conflict = await prisma.product.findFirst({
      where: {
        slug: candidate,
        ...(existingProductId ? { NOT: { id: existingProductId } } : {}),
      },
      select: { id: true },
    })

    if (!conflict) {
      return candidate
    }

    candidate = `${baseSlug}-${counter}`
    counter += 1
  }
}

async function upsertCategory(name, parentId, meta = {}) {
  const slug = parentId ? `${meta.parentSlug}-${slugify(name)}` : slugify(name)

  return prisma.category.upsert({
    where: { slug },
    update: {
      name,
      parentId,
      description: meta.description || undefined,
      imageUrl: meta.imageUrl || undefined,
      displayOrder: meta.displayOrder ?? undefined,
      isActive: true,
    },
    create: {
      name,
      slug,
      parentId,
      description: meta.description || null,
      imageUrl: meta.imageUrl || null,
      displayOrder: meta.displayOrder ?? 0,
      isActive: true,
    },
  })
}

async function main() {
  const workbookPath = resolveWorkbookPath()
  if (!workbookPath) {
    throw new Error(`Workbook not found at any of: ${WORKBOOK_CANDIDATES.join(", ")}`)
  }

  const workbook = XLSX.readFile(workbookPath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" })

  ensureDir(PUBLIC_CATALOG_DIR)
  ensureDir(PUBLIC_CATEGORY_DIR)

  const summary = {
    rows: rows.length,
    productsCreated: 0,
    productsUpdated: 0,
    imagesCopied: 0,
    missingImages: [],
  }

  const rootCategoryCache = new Map()

  for (const [index, row] of rows.entries()) {
    const topCategoryName = cleanText(row.category)?.toUpperCase()
    const subCategoryName = cleanText(row["Sub Category"]) || inferSubCategoryName(row.product_name)
    const name = cleanText(row.product_name)
    const sku = cleanText(row.sku)

    if (!topCategoryName || !name || !sku) {
      console.warn(`Skipping row ${index + 2} because required fields are missing.`)
      continue
    }

    let rootCategory = rootCategoryCache.get(topCategoryName)
    if (!rootCategory) {
      const rootMeta = ROOT_CATEGORY_META[topCategoryName] || {}
      rootCategory = await upsertCategory(topCategoryName, null, {
        description: rootMeta.description,
        imageUrl: copyCategoryImage(rootMeta.imageFile),
        displayOrder: rootMeta.displayOrder ?? index + 1,
      })
      rootCategoryCache.set(topCategoryName, rootCategory)
    }

    const subCategory = subCategoryName
      ? await upsertCategory(subCategoryName.trim(), rootCategory.id, {
          parentSlug: rootCategory.slug,
        })
      : null

    const existingProduct = await prisma.product.findUnique({
      where: { sku },
      include: {
        images: true,
      },
    })

    const slug = await resolveProductSlug(name, sku, existingProduct?.id)
    const price = parseCurrency(row.target_price)
    const buyingPrice = parseCurrency(row.buying_price)
    const moq = parseInteger(row.moq)
    const stockQuantity = moq ?? 25
    const imageSourcePath = resolveWorkbookImage(row.image)
    const productImageUrl = copyProductImage(imageSourcePath, sku)

    if (productImageUrl) {
      summary.imagesCopied += 1
    } else {
      summary.missingImages.push({ sku, name, image: cleanText(row.image) })
    }

    const product = await prisma.product.upsert({
      where: { sku },
      update: {
        name,
        slug,
        description: cleanText(row.long_description),
        shortDescription: cleanText(row.short_description),
        price,
        compareAtPrice: null,
        stockQuantity,
        lowStockThreshold: Math.min(10, stockQuantity),
        isActive: true,
        bis: cleanText(row.bis),
        supplier: cleanText(row.supplier),
        location: cleanText(row.location),
        moq,
        buyingPrice,
      },
      create: {
        name,
        slug,
        description: cleanText(row.long_description),
        shortDescription: cleanText(row.short_description),
        price,
        compareAtPrice: null,
        stockQuantity,
        lowStockThreshold: Math.min(10, stockQuantity),
        sku,
        isActive: true,
        bis: cleanText(row.bis),
        supplier: cleanText(row.supplier),
        location: cleanText(row.location),
        moq,
        buyingPrice,
      },
    })

    if (existingProduct) {
      summary.productsUpdated += 1
    } else {
      summary.productsCreated += 1
    }

    await prisma.productCategory.deleteMany({
      where: { productId: product.id },
    })

    await prisma.productCategory.createMany({
      data: [
        {
          productId: product.id,
          categoryId: rootCategory.id,
          isPrimary: !subCategory,
        },
        ...(subCategory
          ? [
              {
                productId: product.id,
                categoryId: subCategory.id,
                isPrimary: true,
              },
            ]
          : []),
      ],
    })

    const existingVariantCount = await prisma.productVariant.count({
      where: { productId: product.id },
    })

    if (existingVariantCount === 0) {
      await prisma.$transaction(async (tx) => {
        await tx.productColor.deleteMany({ where: { productId: product.id } })
        await tx.productImage.deleteMany({ where: { productId: product.id } })
        await tx.productVariant.deleteMany({ where: { productId: product.id } })

        const defaultColor = await tx.productColor.create({
          data: {
            productId: product.id,
            colorName: "Default",
            colorCode: null,
            sortOrder: 0,
          },
        })

        if (productImageUrl) {
          await tx.productImage.create({
            data: {
              productId: product.id,
              colorId: defaultColor.id,
              imageUrl: productImageUrl,
              altText: name,
              isPrimary: true,
              sortOrder: 0,
            },
          })
        }

        await tx.productVariant.create({
          data: {
            productId: product.id,
            colorId: defaultColor.id,
            size: "Default",
            price: null,
            stock: stockQuantity,
            sku: `${sku}-DEFAULT`,
            isActive: true,
            sortOrder: 0,
            name: "Size",
            value: "Default",
          },
        })
      })
    } else if (existingVariantCount === 1) {
      // Re-import: product has a single (default) variant — sync its stock to the
      // latest Excel value so the admin catalog (which reads variant stock) is correct.
      const defaultVariant = await prisma.productVariant.findFirst({
        where: { productId: product.id },
      })
      if (defaultVariant) {
        await prisma.productVariant.update({
          where: { id: defaultVariant.id },
          data: { stock: stockQuantity },
        })
        summary.variantStockSynced = (summary.variantStockSynced || 0) + 1
      }
    }
    // Note: products with multiple variants are managed manually in admin and
    // are not overwritten by the Excel import.
  }

  console.log(JSON.stringify(summary, null, 2))
}

main()
  .catch((error) => {
    console.error("Excel import failed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
