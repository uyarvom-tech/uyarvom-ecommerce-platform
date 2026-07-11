"use server"

import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import Razorpay from "razorpay"
import { getSystemSetting } from "@/lib/settings"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
})

export async function createOrder(data: {
  addressId: string
  paymentMethod: string
  notes?: string
  couponCode?: string
  couponDiscount?: number
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to place an order." }
  }

  const { addressId, paymentMethod, notes } = data

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: true,
        productVariant: {
          include: {
            color: true,
          },
        },
      },
    })

    if (cartItems.length === 0) {
      return { error: "Your cart is empty." }
    }

    let subtotal = 0
    for (const item of cartItems) {
      if (!item.productVariant) {
        return { error: `Cart item "${item.product.name}" is missing a selected variant.` }
      }

      const currentStock = item.productVariant.stock
      if (currentStock < item.quantity) {
        return { error: `Variant "${item.product.name}" has insufficient stock.` }
      }

      const price = item.productVariant.price ?? item.product.price
      subtotal += price * item.quantity
    }

    const shippingThreshold = Number(await getSystemSetting("shipping_threshold", "999")) || 999
    const shippingFee = Number(await getSystemSetting("shipping_fee", "50")) || 50
    const taxRate = (Number(await getSystemSetting("tax_rate", "18")) || 18) / 100

    const shipping = subtotal >= shippingThreshold ? 0 : shippingFee
    const tax = Math.round(subtotal * taxRate)
    const discount = data.couponDiscount ? Math.min(data.couponDiscount, subtotal + shipping + tax - 1) : 0
    const total = Math.max(1, subtotal + shipping + tax - discount) // Minimum ₹1

    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: user.id,
      },
    })

    if (!address) {
      return { error: "Delivery address not found." }
    }

    const orderNumber = `ORD-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          status: paymentMethod === "cod" ? "confirmed" : "pending",
          paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
          paymentMethod,
          subtotal,
          shipping,
          tax,
          discount,
          total,
          notes,
          shippingName: address.fullName,
          shippingEmail: user.email!,
          shippingPhone: address.phone,
          shippingAddress1: address.addressLine1,
          shippingAddress2: address.addressLine2,
          shippingCity: address.city,
          shippingState: address.state,
          shippingZip: address.postalCode,
          shippingCountry: address.country,
          shippingAddressId: address.id,
        } as any,
      })

      for (const item of cartItems) {
        if (!item.productVariant) {
          throw new Error(`Cart item "${item.product.name}" is missing a selected variant.`)
        }

        const price = item.productVariant.price ?? item.product.price

        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            price,
            total: price * item.quantity,
            productName: item.product.name,
            variantName: item.productVariant.color
              ? `${item.productVariant.color.colorName ?? "Variant"} / ${item.productVariant.size}`
              : item.productVariant.size,
            skuSnapshot: item.productVariant?.sku ?? item.product.sku,
          } as any,
        })

        if (!item.productVariantId) {
          throw new Error(`Cart item "${item.product.name}" is missing a selected variant.`)
        }

        // Atomic stock check + decrement (prevents race condition / overselling)
        const updated = await tx.productVariant.updateMany({
          where: {
            id: item.productVariantId,
            stock: { gte: item.quantity }, // Only decrement if enough stock
          },
          data: { stock: { decrement: item.quantity } },
        })

        if (updated.count === 0) {
          throw new Error(`Insufficient stock for "${item.product.name}". Please refresh and try again.`)
        }
      }

      await tx.orderEvent.create({
        data: {
          orderId: newOrder.id,
          type: "order_placed",
          title: "Order Placed",
          description: `Order successfully placed via ${paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}.`,
          actorId: user.id,
        },
      })

      // Sync product-level stockQuantity with variant sum
      const productIds = [...new Set(cartItems.map(item => item.productId))]
      for (const pid of productIds) {
        const agg = await tx.productVariant.aggregate({
          where: { productId: pid },
          _sum: { stock: true },
        })
        await tx.product.update({
          where: { id: pid },
          data: { stockQuantity: agg._sum.stock ?? 0 },
        })
      }

      await tx.cartItem.deleteMany({
        where: { userId: user.id },
      })

      return newOrder
    }, {
      maxWait: 10000,  // Max time to wait for a transaction slot (10s)
      timeout: 30000,  // Max time the transaction can run (30s)
    })

    if (paymentMethod === "online") {
      try {
        const razorpayOrder = (await razorpay.orders.create({
          amount: Math.round(total * 100),
          currency: "INR",
          receipt: order.orderNumber,
        })) as any

        await prisma.order.update({
          where: { id: order.id },
          data: { razorpayOrderId: razorpayOrder.id },
        })

        revalidatePath("/orders")
        revalidatePath("/cart")

        return {
          success: true,
          orderId: order.id,
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          customerName: address.fullName,
          customerEmail: user.email,
          customerPhone: address.phone,
        }
      } catch (error) {
        console.error("Razorpay Error:", error)
        revalidatePath("/orders")
        revalidatePath("/cart")

        return {
          success: true,
          orderId: order.id,
          paymentInitFailed: true,
          error: "Order placed but payment initialization failed. Please pay from your account.",
        }
      }
    }

    revalidatePath("/orders")
    revalidatePath("/cart")

    return { success: true, orderId: order.id }
  } catch (error: any) {
    console.error("Checkout Error:", error)
    return { error: error.message || "An unexpected error occurred during checkout." }
  }
}
