"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createTicket(data: {
    subject: string
    category: string
    priority?: string
    orderId?: string
    productId?: string
    message: string
}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { error: "You must be logged in to create a ticket." }

        const ticketNumber = `TKT-${Date.now()}`

        const ticket = await prisma.supportTicket.create({
            data: {
                ticketNumber,
                userId: user.id,
                subject: data.subject,
                category: data.category,
                priority: data.priority || "medium",
                orderId: data.orderId || null,
                productId: data.productId || null,
                status: "open",
                messages: {
                    create: {
                        senderId: user.id,
                        body: data.message,
                    },
                },
            },
        })

        revalidatePath("/support")
        revalidatePath("/account")
        return { success: true, ticketId: ticket.id }
    } catch (error: any) {
        console.error("Ticket Creation Error:", error)
        return { error: error.message || "Failed to create support ticket." }
    }
}

export async function replyToTicket(ticketId: string, message: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { error: "Unauthorized" }

        // Check if user owns the ticket or is an admin
        const ticket = await prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: { customer: true }
        })

        if (!ticket) return { error: "Ticket not found" }

        // Simple check: only ticket owner can reply for now (Admins will be handled in admin actions)
        if (ticket.userId !== user.id) {
            // Check if user is admin
            const admin = await prisma.adminUser.findUnique({
                where: { userId: user.id }
            })
            if (!admin) return { error: "Unauthorized" }
        }

        await prisma.supportMessage.create({
            data: {
                ticketId,
                senderId: user.id,
                body: message,
                isInternal: false,
            },
        })

        await prisma.supportTicket.update({
            where: { id: ticketId },
            data: {
                latestReplyAt: new Date(),
                status: ticket.status === "resolved" || ticket.status === "closed" ? "open" : ticket.status,
            },
        })

        revalidatePath(`/support/tickets/${ticketId}`)
        revalidatePath(`/admin/support/${ticketId}`)
        return { success: true }
    } catch (error: any) {
        console.error("Reply Error:", error)
        return { error: error.message || "Failed to send reply." }
    }
}
