"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

async function checkAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const admin = await (prisma as any).adminUser.findUnique({
        where: { userId: user.id }
    })

    if (!admin) throw new Error("Unauthorized: Admin access required")
    return admin
}

export async function assignTicket(ticketId: string) {
    try {
        const admin = await checkAdmin()
        await (prisma as any).supportTicket.update({
            where: { id: ticketId },
            data: { assignedToId: admin.userId }
        })
        revalidatePath(`/admin/support/${ticketId}`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function updateTicketStatus(ticketId: string, status: string) {
    try {
        await checkAdmin()
        await (prisma as any).supportTicket.update({
            where: { id: ticketId },
            data: { status }
        })
        revalidatePath(`/admin/support/${ticketId}`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
