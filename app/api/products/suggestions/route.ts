import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { STORE_ROOT_CATEGORY_NAMES } from "@/lib/store-catalog"

const pageSuggestions = [
  { text: "Home", type: "page", href: "/" },
  { text: "Products", type: "page", href: "/products" },
  { text: "Offers", type: "page", href: "/offers" },
  { text: "Track Order", type: "page", href: "/track" },
  { text: "Delivery Information", type: "page", href: "/delivery" },
  { text: "Shipping Policy", type: "page", href: "/shipping" },
  { text: "Returns & Exchanges", type: "page", href: "/returns" },
  { text: "Privacy Policy", type: "page", href: "/privacy" },
  { text: "Support", type: "page", href: "/support" },
  { text: "About Us", type: "page", href: "/about" },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = (searchParams.get("q") || "").trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const normalizedQuery = query.toLowerCase()

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query } },
            { shortDescription: { contains: query } },
          ],
        },
        select: {
          name: true,
          slug: true,
        },
        take: 6,
      }),
      prisma.category.findMany({
        where: {
          isActive: true,
          name: { contains: query },
          OR: [
            {
              AND: [
                { parentId: null },
                { name: { in: [...STORE_ROOT_CATEGORY_NAMES] } },
              ],
            },
            {
              parent: {
                name: { in: [...STORE_ROOT_CATEGORY_NAMES] },
              },
            },
          ],
        },
        select: {
          parentId: true,
          name: true,
          slug: true,
          parent: {
            select: {
              slug: true,
            },
          },
        },
        take: 5,
      }),
    ])

    const pages = pageSuggestions.filter((page) => page.text.toLowerCase().includes(normalizedQuery)).slice(0, 4)

    const suggestions = [
      ...products.map((product) => ({
        text: product.name,
        type: "product",
        href: `/products/${product.slug}`,
      })),
      ...categories.map((category) => ({
        text: category.name,
        type: "category",
        href:
          category.parentId && category.parent?.slug
            ? `/?category=${category.parent.slug}&sub=${category.slug}`
            : `/?category=${category.slug}`,
      })),
      ...pages,
    ]

    const uniqueSuggestions = suggestions
      .filter((item, index, all) => index === all.findIndex((entry) => entry.text.toLowerCase() === item.text.toLowerCase()))
      .slice(0, 10)

    return NextResponse.json({ suggestions: uniqueSuggestions })
  } catch (error) {
    console.error("Error fetching suggestions:", error)
    return NextResponse.json({ suggestions: [] })
  }
}
