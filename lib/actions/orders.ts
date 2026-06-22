"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function requestCancellation(orderId: string, reason: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { error: "Unauthorized" }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { orderItems: true }
        })

        if (!order || order.userId !== user.id) {
            return { error: "Order not found" }
        }

        // Eligibility check
        const nonCancellableStatuses = ["shipped", "delivered", "cancelled", "returned"]
        if (nonCancellableStatuses.includes(order.status)) {
            return { error: `Order cannot be cancelled because it is already ${order.status}.` }
        }

        await prisma.$transaction(async (tx) => {
            // 1. Update order status
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: "cancelled",
                    cancelledAt: new Date(),
                    cancellationReason: reason,
                },
            })

            // 2. Add event
            await tx.orderEvent.create({
                data: {
                    orderId,
                    type: "cancelled",
                    title: "Order Cancelled",
                    description: `Cancelled by customer. Reason: ${reason}`,
                    actorId: user.id,
                },
            })

            // 3. Restore stock
            for (const item of order.orderItems) {
                if (!item.productVariantId) {
                    continue // Skip items without variant (graceful, don't abort)
                }

                await tx.productVariant.update({
                    where: { id: item.productVariantId },
                    data: { stock: { increment: item.quantity } },
                })
            }

            // 4. Sync product-level stockQuantity
            const productIds = [...new Set(order.orderItems.map(i => i.productId))]
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
        })

        revalidatePath(`/orders/${orderId}`)
        revalidatePath("/orders")
        return { success: true }
    } catch (error: any) {
        console.error("Cancellation Error:", error)
        return { error: error.message || "Failed to cancel order" }
    }
}

export async function requestReturn(orderId: string, reason: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { error: "Unauthorized" }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
        })

        if (!order || order.userId !== user.id) {
            return { error: "Order not found" }
        }

        if (order.status !== "delivered") {
            return { error: "Only delivered orders can be returned." }
        }

        // Check if within return window (e.g., 7 days)
        const deliveredAt = order.deliveredAt
        if (!deliveredAt) {
            return { error: "Delivery date not recorded. Please contact support." }
        }
        const daysSinceDelivery = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceDelivery > 7) {
            return { error: "Return window (7 days) has expired." }
        }

        await prisma.$transaction([
            prisma.order.update({
                where: { id: orderId },
                data: {
                    returnStatus: "requested",
                    returnRequestedAt: new Date(),
                    returnReason: reason,
                },
            }),
            prisma.orderEvent.create({
                data: {
                    orderId,
                    type: "return_requested",
                    title: "Return Requested",
                    description: `Customer requested a return. Reason: ${reason}`,
                    actorId: user.id,
                },
            })
        ])

        revalidatePath(`/orders/${orderId}`)
        return { success: true }
    } catch (error: any) {
        console.error("Return Error:", error)
        return { error: error.message || "Failed to request return" }
    }
}
