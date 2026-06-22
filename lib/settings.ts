import { prisma } from "@/lib/prisma"

export async function getSystemSetting(key: string, defaultValue: string): Promise<string> {
    try {
        const setting = await (prisma as any).systemSetting.findUnique({
            where: { key }
        })
        return setting?.value ?? defaultValue
    } catch {
        return defaultValue
    }
}

export async function getSystemSettings() {
    try {
        const settings = await (prisma as any).systemSetting.findMany()
        const settingsMap: Record<string, string> = {}
        settings.forEach((s: any) => {
            settingsMap[s.key] = s.value
        })
        return settingsMap
    } catch {
        return {}
    }
}
