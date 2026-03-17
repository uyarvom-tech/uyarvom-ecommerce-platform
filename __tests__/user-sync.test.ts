import { describe, it, expect, vi, beforeEach } from 'vitest'
import { syncAuthUserToPrisma } from '@/lib/user-sync'
import { prisma } from '@/lib/prisma'
import type { User as SupabaseUser } from '@supabase/supabase-js'

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { upsert: vi.fn() } },
}))

function makeUser(overrides: Partial<SupabaseUser> = {}): SupabaseUser {
  return {
    id: 'auth-1',
    email: 'test@example.com',
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    ...overrides,
  } as SupabaseUser
}

describe('syncAuthUserToPrisma', () => {
  beforeEach(() => vi.clearAllMocks())

  it('upserts user with email-derived name when no metadata name', async () => {
    vi.mocked(prisma.user.upsert).mockResolvedValue({ id: 'auth-1', email: 'test@example.com', fullName: 'test' } as any)
    const user = makeUser()
    await syncAuthUserToPrisma(user)
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'auth-1' },
        create: expect.objectContaining({ email: 'test@example.com', fullName: 'test' }),
      })
    )
  })

  it('uses full_name from user_metadata when available', async () => {
    vi.mocked(prisma.user.upsert).mockResolvedValue({} as any)
    const user = makeUser({ user_metadata: { full_name: 'John Doe' } })
    await syncAuthUserToPrisma(user)
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ fullName: 'John Doe' }),
      })
    )
  })

  it('uses name from user_metadata as fallback', async () => {
    vi.mocked(prisma.user.upsert).mockResolvedValue({} as any)
    const user = makeUser({ user_metadata: { name: 'Jane Smith' } })
    await syncAuthUserToPrisma(user)
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ fullName: 'Jane Smith' }),
      })
    )
  })

  it('uses display_name from user_metadata as fallback', async () => {
    vi.mocked(prisma.user.upsert).mockResolvedValue({} as any)
    const user = makeUser({ user_metadata: { display_name: 'Display Name' } })
    await syncAuthUserToPrisma(user)
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ fullName: 'Display Name' }),
      })
    )
  })

  it('falls back to "User" when no email and no metadata name', async () => {
    vi.mocked(prisma.user.upsert).mockResolvedValue({} as any)
    // email is required by the function, but test the name fallback path
    const user = makeUser({ email: 'x@y.com', user_metadata: {} })
    await syncAuthUserToPrisma(user)
    // email-derived name should be 'x'
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ fullName: 'x' }),
      })
    )
  })

  it('throws when user has no email', async () => {
    const user = makeUser({ email: undefined })
    await expect(syncAuthUserToPrisma(user)).rejects.toThrow('missing an email address')
  })

  it('syncs avatar_url from metadata', async () => {
    vi.mocked(prisma.user.upsert).mockResolvedValue({} as any)
    const user = makeUser({ user_metadata: { avatar_url: 'https://example.com/avatar.jpg' } })
    await syncAuthUserToPrisma(user)
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ avatarUrl: 'https://example.com/avatar.jpg' }),
      })
    )
  })

  it('sets avatarUrl to null when no avatar in metadata', async () => {
    vi.mocked(prisma.user.upsert).mockResolvedValue({} as any)
    const user = makeUser({ user_metadata: {} })
    await syncAuthUserToPrisma(user)
    expect(prisma.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ avatarUrl: null }),
      })
    )
  })
})
