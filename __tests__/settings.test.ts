import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSystemSetting, getSystemSettings } from '@/lib/settings'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    systemSetting: { findUnique: vi.fn(), findMany: vi.fn() },
  },
}))

describe('settings', () => {
  beforeEach(() => vi.clearAllMocks())

  // ─── getSystemSetting ─────────────────────────────────────────────────────
  describe('getSystemSetting', () => {
    it('returns setting value when key exists', async () => {
      vi.mocked((prisma as any).systemSetting.findUnique).mockResolvedValue({ key: 'shipping_fee', value: '75' })
      const result = await getSystemSetting('shipping_fee', '50')
      expect(result).toBe('75')
    })

    it('returns default value when key does not exist', async () => {
      vi.mocked((prisma as any).systemSetting.findUnique).mockResolvedValue(null)
      const result = await getSystemSetting('nonexistent_key', 'default_val')
      expect(result).toBe('default_val')
    })

    it('returns default value on database error', async () => {
      vi.mocked((prisma as any).systemSetting.findUnique).mockRejectedValue(new Error('DB error'))
      const result = await getSystemSetting('shipping_fee', '50')
      expect(result).toBe('50')
    })

    it('returns default value when setting value is null', async () => {
      vi.mocked((prisma as any).systemSetting.findUnique).mockResolvedValue({ key: 'tax_rate', value: null })
      const result = await getSystemSetting('tax_rate', '18')
      expect(result).toBe('18')
    })
  })

  // ─── getSystemSettings ────────────────────────────────────────────────────
  describe('getSystemSettings', () => {
    it('returns all settings as a key-value map', async () => {
      vi.mocked((prisma as any).systemSetting.findMany).mockResolvedValue([
        { key: 'shipping_fee', value: '50' },
        { key: 'tax_rate', value: '18' },
        { key: 'shipping_threshold', value: '999' },
      ])
      const result = await getSystemSettings()
      expect(result).toEqual({ shipping_fee: '50', tax_rate: '18', shipping_threshold: '999' })
    })

    it('returns empty object on database error', async () => {
      vi.mocked((prisma as any).systemSetting.findMany).mockRejectedValue(new Error('DB error'))
      const result = await getSystemSettings()
      expect(result).toEqual({})
    })

    it('returns empty object when no settings exist', async () => {
      vi.mocked((prisma as any).systemSetting.findMany).mockResolvedValue([])
      const result = await getSystemSettings()
      expect(result).toEqual({})
    })
  })
})
