import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
    order: { aggregate: vi.fn() },
    customerNote: { findMany: vi.fn(), create: vi.fn() },
    loyaltyAccount: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    loyaltyTransaction: { create: vi.fn() },
    customerSegment: { findMany: vi.fn(), upsert: vi.fn() },
    customerSegmentMember: { deleteMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/auth-middleware', () => ({
  requireStaffAccess: vi.fn().mockResolvedValue({ userId: 'admin-1', role: 'admin' }),
}))

import { prisma } from '@/lib/prisma'
import { GET as getCustomers } from '@/app/api/admin/customers/route'
import { GET as getCustomerDetail } from '@/app/api/admin/customers/[id]/route'
import { POST as addNote } from '@/app/api/admin/customers/[id]/notes/route'
import { GET as getLoyalty, POST as awardPoints } from '@/app/api/admin/loyalty/route'
import { GET as getSegments } from '@/app/api/admin/segments/route'

const mockPrisma = vi.mocked(prisma)

describe('Customer Listing API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GET returns paginated customer list', async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: 'u1', email: 'test@test.com', fullName: 'Test User' }] as any)
    mockPrisma.user.count.mockResolvedValue(1)

    const req = new NextRequest('http://localhost/api/admin/customers')
    const res = await getCustomers(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.customers).toHaveLength(1)
    expect(json.pagination.total).toBe(1)
  })

  it('GET supports search filter', async () => {
    mockPrisma.user.findMany.mockResolvedValue([])
    mockPrisma.user.count.mockResolvedValue(0)

    const req = new NextRequest('http://localhost/api/admin/customers?search=john')
    await getCustomers(req)
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) })
    )
  })
})

describe('Customer Detail API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GET returns customer with analytics', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u1', email: 'test@test.com', fullName: 'Test',
      orders: [{ id: 'o1', total: 1000, createdAt: new Date() }],
      addresses: [], reviews: [], supportTickets: [], _count: { orders: 1, reviews: 0, supportTickets: 0, wishlistItems: 0 },
    } as any)
    mockPrisma.order.aggregate.mockResolvedValue({ _sum: { total: 1000 }, _count: 1, _min: { createdAt: new Date() }, _max: { createdAt: new Date() } } as any)
    mockPrisma.customerNote.findMany.mockResolvedValue([])

    const req = new NextRequest('http://localhost/api/admin/customers/u1')
    const res = await getCustomerDetail(req, { params: Promise.resolve({ id: 'u1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('analytics')
    expect(json.analytics).toHaveProperty('rfmScores')
    expect(json.analytics).toHaveProperty('segment')
  })

  it('GET returns 404 for non-existent customer', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/admin/customers/bad')
    const res = await getCustomerDetail(req, { params: Promise.resolve({ id: 'bad' }) })
    expect(res.status).toBe(404)
  })
})

describe('Customer Notes API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('POST adds a note', async () => {
    mockPrisma.customerNote.create.mockResolvedValue({ id: 'n1', content: 'Test note' } as any)

    const req = new NextRequest('http://localhost/api/admin/customers/u1/notes', {
      method: 'POST',
      body: JSON.stringify({ type: 'general', content: 'VIP customer' }),
    })
    const res = await addNote(req, { params: Promise.resolve({ id: 'u1' }) })
    expect(res.status).toBe(201)
  })

  it('POST rejects empty content', async () => {
    const req = new NextRequest('http://localhost/api/admin/customers/u1/notes', {
      method: 'POST',
      body: JSON.stringify({ content: '' }),
    })
    const res = await addNote(req, { params: Promise.resolve({ id: 'u1' }) })
    expect(res.status).toBe(400)
  })
})

describe('Loyalty API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma))
  })

  it('GET returns loyalty account (creates if missing)', async () => {
    mockPrisma.loyaltyAccount.findUnique.mockResolvedValue({ id: 'la1', currentPoints: 100, tier: 'bronze', transactions: [] } as any)

    const req = new NextRequest('http://localhost/api/admin/loyalty?userId=u1')
    const res = await getLoyalty(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.currentPoints).toBe(100)
  })

  it('GET rejects missing userId', async () => {
    const req = new NextRequest('http://localhost/api/admin/loyalty')
    const res = await getLoyalty(req)
    expect(res.status).toBe(400)
  })

  it('POST awards points', async () => {
    mockPrisma.loyaltyAccount.findUnique.mockResolvedValue({ id: 'la1', userId: 'u1', currentPoints: 100, lifetimePoints: 100, redeemedPoints: 0, tier: 'bronze' } as any)
    mockPrisma.loyaltyAccount.update.mockResolvedValue({ currentPoints: 200, tier: 'bronze' } as any)
    mockPrisma.loyaltyTransaction.create.mockResolvedValue({} as any)

    const req = new NextRequest('http://localhost/api/admin/loyalty', {
      method: 'POST',
      body: JSON.stringify({ userId: 'u1', type: 'earned', points: 100, description: 'Order bonus' }),
    })
    const res = await awardPoints(req)
    expect(res.status).toBe(200)
  })

  it('POST rejects insufficient points for redemption', async () => {
    mockPrisma.loyaltyAccount.findUnique.mockResolvedValue({ id: 'la1', userId: 'u1', currentPoints: 50, lifetimePoints: 50, redeemedPoints: 0, tier: 'bronze' } as any)

    const req = new NextRequest('http://localhost/api/admin/loyalty', {
      method: 'POST',
      body: JSON.stringify({ userId: 'u1', type: 'redeemed', points: 100 }),
    })
    const res = await awardPoints(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Insufficient points')
  })

  it('POST rejects invalid type', async () => {
    const req = new NextRequest('http://localhost/api/admin/loyalty', {
      method: 'POST',
      body: JSON.stringify({ userId: 'u1', type: 'invalid', points: 10 }),
    })
    const res = await awardPoints(req)
    expect(res.status).toBe(400)
  })
})

describe('Segments API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GET returns segments with labels', async () => {
    mockPrisma.customerSegment.findMany.mockResolvedValue([{ id: 's1', name: 'champions', memberCount: 5 }] as any)

    const req = new NextRequest('http://localhost/api/admin/segments')
    const res = await getSegments(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('segments')
    expect(json).toHaveProperty('segmentLabels')
  })
})
