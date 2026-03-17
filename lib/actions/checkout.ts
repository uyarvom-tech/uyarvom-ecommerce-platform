"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import Razorpay from "razorpay"
import { getSystemSetting } from "@/lib/settings"

// Note: Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are in .env
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
})

export async function createOrder(data: {
    addressId: string
    paymentMethod: string
    notes?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "You must be logged in to place an order." }
    }

    const { addressId, paymentMethod, notes } = data

    try {
        // 1. Get cart items with product info using Prisma
        const cartItems = await prisma.cartItem.findMany({
            where: { userId: user.id },
            include: {
                product: true,
                productVariant: true,
            },
        })

        if (cartItems.length === 0) {
            return { error: "Your cart is empty." }
        }

        // 2. Validate stock and calculate totals
        let subtotal = 0
        for (const item of cartItems) {
            const currentStock = item.productVariant ? item.productVariant.stock : item.product.stockQuantity
            if (currentStock < item.quantity) {
                return { error: `Product "${item.product.name}" has insufficient stock.` }
            }
            const price = item.productVariant?.price ?? item.product.price
            subtotal += price * item.quantity
        }

        // Fetch business rules from dynamic settings
        const shippingThreshold = Number(await getSystemSetting("shipping_threshold", "999"))
        const shippingFee = Number(await getSystemSetting("shipping_fee", "50"))
        const taxRate = Number(await getSystemSetting("tax_rate", "18")) / 100

        const shipping = subtotal >= shippingThreshold ? 0 : shippingFee
        const tax = Math.round(subtotal * taxRate)
        const total = subtotal + shipping + tax

        // 3. Get delivery address
        const address = await (prisma as any).address.findUnique({
            where: { id: addressId },
        })

        if (!address) {
            return { error: "Delivery address not found." }
        }

        // 4. Create Order Number
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

        // 5. Execute Order Placement Transaction
        const order = await prisma.$transaction(async (tx) => {
            // a. Create the order
            const newOrder = await (tx as any).order.create({
                data: {
                    orderNumber,
                    userId: user.id,
                    status: "pending",
                    paymentStatus: "pending",
                    paymentMethod,
                    subtotal,
                    shipping,
                    tax,
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

            // b. Create order items and deduct stock
            for (const item of cartItems) {
                const price = item.productVariant?.price ?? item.product.price

                await (tx as any).orderItem.create({
                    data: {
                        orderId: newOrder.id,
                        productId: item.productId,
                        productVariantId: item.productVariantId,
                        quantity: item.quantity,
                        price,
                        total: price * item.quantity,
                        productName: item.product.name,
                        variantName: item.productVariant ? `${item.productVariant.name}: ${item.productVariant.value}` : null,
                        skuSnapshot: item.productVariant?.sku ?? item.product.sku,
                    } as any,
                })

                // Stock deduction
                if (item.productVariantId) {
                    await tx.productVariant.update({
                        where: { id: item.productVariantId },
                        data: { stock: { decrement: item.quantity } },
                    })
                } else {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stockQuantity: { decrement: item.quantity } },
                    })
                }
            }

            // c. Create Initial Order Event (Timeline)
            await (tx as any).orderEvent.create({
                data: {
                    orderId: newOrder.id,
                    type: "order_placed",
                    title: "Order Placed",
                    description: `Order successfully placed via ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}.`,
                    actorId: user.id,
                },
            })

            // d. Clear user's cart
            await tx.cartItem.deleteMany({
                where: { userId: user.id },
            })

            return newOrder
        })

        // 6. Handle Razorpay Payment Initialization
        if (paymentMethod === "online") {
            try {
                const razorpayOrder = (await razorpay.orders.create({
                    amount: Math.round(total * 100), // convert to paise
                    currency: "INR",
                    receipt: order.orderNumber,
                })) as any

                // Update with Razorpay Order ID
                await (prisma as any).order.update({
                    where: { id: order.id },
                    data: { razorpayOrderId: razorpayOrder.id },
                })

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
                // If payment init fails, the order is still "pending" and "unpaid"
                return {
                    success: true,
                    orderId: order.id,
                    paymentInitFailed: true,
                    error: "Order placed but payment initialization failed. Please pay from your account."
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
