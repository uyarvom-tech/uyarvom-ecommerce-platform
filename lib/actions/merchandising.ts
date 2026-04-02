"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

async function checkSuperAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const admin = await prisma.adminUser.findUnique({
        where: { userId: user.id }
    })

    if (!admin || admin.role !== 'super_admin') {
        throw new Error("Unauthorized: Super Admin access required")
    }
    return admin
}

export async function updateSystemSetting(key: string, value: string) {
    try {
        await checkSuperAdmin()
        await prisma.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        })
        revalidatePath("/")
        revalidatePath("/admin/settings")
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function upsertHeroBanner(payload: {
    id?: string
    title: string
    subtitle?: string
    imageUrl: string
    linkUrl?: string
    buttonText?: string
    displayOrder?: number
    isActive?: boolean
}) {
    try {
        await checkSuperAdmin()
        if (!payload.title.trim()) {
            return { error: "Title is required" }
        }
        if (!payload.imageUrl.trim()) {
            return { error: "Image URL is required" }
        }

        const displayOrder = Number.isFinite(payload.displayOrder) ? Number(payload.displayOrder) : 0
        const data = {
            title: payload.title.trim(),
            subtitle: payload.subtitle?.trim() || null,
            imageUrl: payload.imageUrl.trim(),
            linkUrl: payload.linkUrl?.trim() || null,
            buttonText: payload.buttonText?.trim() || null,
            displayOrder,
            isActive: payload.isActive ?? true,
        }

        if (payload.id) {
            await prisma.heroBanner.update({
                where: { id: payload.id },
                data
            })
        } else {
            await prisma.heroBanner.create({
                data
            })
        }
        revalidatePath("/")
        revalidatePath("/admin/merchandising")
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function deleteHeroBanner(id: string) {
    try {
        await checkSuperAdmin()
        await prisma.heroBanner.delete({
            where: { id }
        })
        revalidatePath("/")
        revalidatePath("/admin/merchandising")
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
