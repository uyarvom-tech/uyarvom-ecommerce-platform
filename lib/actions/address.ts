"use server"

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addAddress(data: {
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in" }
  }

  try {
    const existingCount = await prisma.address.count({ where: { userId: user.id } })

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: data.fullName,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: "India",
        isDefault: existingCount === 0, // First address is default
      },
    })

    revalidatePath("/checkout")
    return { success: true, addressId: address.id }
  } catch (error: any) {
    console.error("Add address error:", error)
    return { error: error.message || "Failed to add address" }
  }
}
