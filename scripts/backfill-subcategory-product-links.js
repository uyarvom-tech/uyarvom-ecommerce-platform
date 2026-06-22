#!/usr/bin/env node

const path = require("path")
const { PrismaClient } = require("@prisma/client")

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") })

const prisma = new PrismaClient()

function normalize(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

function tokens(value) {
  return normalize(value).split(" ").filter(Boolean)
}

function matchScore(productName, categoryName) {
  const product = normalize(productName)
  const category = normalize(categoryName)
  if (!product || !category) return 0

  if ((product.includes("gift set") || product.includes("gift box")) && category === "gift sets") {
    return 12000
  }

  const categoryTokens = tokens(category)
  const productTokens = new Set(tokens(product))
  const allCategoryTokensExist =
    categoryTokens.length > 0 && categoryTokens.every((token) => productTokens.has(token))

  if (product.startsWith(category)) return 10000 + category.length
  if (allCategoryTokensExist) return 9000 + categoryTokens.length * 100 + category.length
  if (product.includes(category)) return 8000 + category.length

  return 0
}

async function main() {
  const roots = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: true },
  })
  const childrenByRootId = new Map(roots.map((root) => [root.id, root.children]))

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      productCategories: {
        select: {
          categoryId: true,
          isPrimary: true,
          category: {
            select: {
              id: true,
              name: true,
              parentId: true,
            },
          },
        },
      },
    },
  })

  const summary = {
    productsChecked: products.length,
    linksCreated: 0,
    primaryUpdated: 0,
    alreadyLinked: 0,
    noRootCategory: 0,
    noSubcategoryMatch: [],
  }

  for (const product of products) {
    const rootLink = product.productCategories.find((link) => !link.category.parentId)
    if (!rootLink) {
      summary.noRootCategory += 1
      continue
    }

    const children = childrenByRootId.get(rootLink.categoryId) || []
    const matchedSubCategory = children
      .map((category) => ({
        category,
        score: matchScore(product.name, category.name),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)[0]?.category

    if (!matchedSubCategory) {
      summary.noSubcategoryMatch.push(product.name)
      continue
    }

    const existingSubcategoryLink = product.productCategories.find(
      (link) => link.categoryId === matchedSubCategory.id
    )

    if (existingSubcategoryLink) {
      summary.alreadyLinked += 1
      if (!existingSubcategoryLink.isPrimary) {
        await prisma.productCategory.update({
          where: {
            productId_categoryId: {
              productId: product.id,
              categoryId: matchedSubCategory.id,
            },
          },
          data: { isPrimary: true },
        })
        summary.primaryUpdated += 1
      }
      continue
    }

    await prisma.$transaction([
      prisma.productCategory.updateMany({
        where: { productId: product.id },
        data: { isPrimary: false },
      }),
      prisma.productCategory.create({
        data: {
          productId: product.id,
          categoryId: matchedSubCategory.id,
          isPrimary: true,
        },
      }),
    ])

    summary.linksCreated += 1
  }

  console.log(JSON.stringify(summary, null, 2))
}

main()
  .catch((error) => {
    console.error("Subcategory backfill failed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
