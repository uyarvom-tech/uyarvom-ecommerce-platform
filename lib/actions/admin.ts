"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

async function checkAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const admin = await prisma.adminUser.findUnique({
        where: { userId: user.id },
        include: { user: true }
    })

    if (!admin || !admin.isActive) throw new Error("Unauthorized: Admin access required")
    return admin
}

export async function updateOrderStatus(orderId: string, payload: {
    status: string
    trackingNumber?: string
    courierName?: string
    paymentStatus?: string
}) {
    try {
        const admin = await checkAdmin()
        const { status, trackingNumber, courierName, paymentStatus } = payload

        const data: any = { status }
        if (trackingNumber !== undefined) data.trackingNumber = trackingNumber
        if (courierName !== undefined) data.courierName = courierName
        if (paymentStatus !== undefined) data.paymentStatus = paymentStatus

        if (status === "shipped" && !data.shippedAt) data.shippedAt = new Date()
        if (status === "delivered" && !data.deliveredAt) data.deliveredAt = new Date()

        const order = await prisma.order.update({
            where: { id: orderId },
            data,
        })

        // Log the event
        await prisma.orderEvent.create({
            data: {
                orderId,
                type: status,
                title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                description: trackingNumber ? `Shipment tracked: ${trackingNumber} via ${courierName}` : `Status updated to ${status} by admin.`,
                actorId: admin.userId,
            }
        })

        // Audit Log for Super Admin/History
        await prisma.auditLog.create({
            data: {
                actorId: admin.userId,
                entityType: "order",
                entityId: orderId,
                action: "update_status",
                description: `Order status changed to ${status}`,
                metadataJson: JSON.stringify(payload)
            }
        })

        revalidatePath(`/admin/orders/${orderId}`)
        revalidatePath(`/orders/${orderId}`)
        return { success: true }
    } catch (error: any) {
        console.error("Admin Order Update Error:", error)
        return { error: error.message || "Failed to update order" }
    }
}

export async function processReturn(orderId: string, action: "approve" | "reject", internalNotes?: string) {
    try {
        const admin = await checkAdmin()

        const returnStatus = action === "approve" ? "approved" : "rejected"

        await prisma.$transaction([
            prisma.order.update({
                where: { id: orderId },
                data: { returnStatus }
            }),
            prisma.orderEvent.create({
                data: {
                    orderId,
                    type: `return_${returnStatus}`,
                    title: `Return ${returnStatus.charAt(0).toUpperCase() + returnStatus.slice(1)}`,
                    description: internalNotes || `Return request has been ${returnStatus}.`,
                    actorId: admin.userId,
                }
            })
        ])

        revalidatePath(`/admin/orders/${orderId}`)
        return { success: true }
    } catch (error: any) {
        console.error("Return Process Error:", error)
        return { error: error.message || "Failed to process return" }
    }
}

export async function updateStock(itemId: string, itemType: "product" | "variant", quantity: number, reason: string) {
    try {
        const admin = await checkAdmin()

        if (itemType === "product") {
            await prisma.product.update({
                where: { id: itemId },
                data: { stockQuantity: quantity }
            })
        } else {
            await prisma.productVariant.update({
                where: { id: itemId },
                data: { stock: quantity }
            })
        }

        await prisma.auditLog.create({
            data: {
                actorId: admin.userId,
                entityType: itemType,
                entityId: itemId,
                action: "stock_adjustment",
                description: `Stock adjusted to ${quantity}. Reason: ${reason}`,
            }
        })

        revalidatePath("/admin/inventory")
        return { success: true }
    } catch (error: any) {
        return { error: error.message || "Failed to update stock" }
    }
}
