import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/products/route'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

function makeSupabaseMock(products: any[], totalCount = 0) {
  const queryBuilder: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data: products, error: null, count: products.length }),
  }
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          ...queryBuilder,
          select: vi.fn().mockImplementation((cols: string) => {
            // head: true path for count
            if (cols === '*') return { eq: vi.fn().mockResolvedValue({ count: totalCount }) }
            return queryBuilder
          }),
        }
      }
      return queryBuilder
    }),
  }
}

describe('GET /api/products', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns products with pagination', async () => {
    const mockProducts = [{ id: 'p1', name: 'Pot', is_active: true }]
    const supabase = makeSupabaseMock(mockProducts, 1)
    vi.mocked(createClient).mockResolvedValue(supabase as any)
    const req = new NextRequest('http://localhost/api/products')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('products')
    expect(json).toHaveProperty('pagination')
  })

  it('returns 500 on supabase error', async () => {
    const queryBuilder: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error'), count: 0 }),
    }
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn().mockReturnValue(queryBuilder) } as any)
    const req = new NextRequest('http://localhost/api/products')
    const res = await GET(req)
    expect(res.status).toBe(500)
  })

  it('handles search query param', async () => {
    const supabase = makeSupabaseMock([], 0)
    vi.mocked(createClient).mockResolvedValue(supabase as any)
    const req = new NextRequest('http://localhost/api/products?search=pot')
    const res = await GET(req)
    expect(res.status).toBe(200)
  })

  it('handles sort=price-asc param', async () => {
    const supabase = makeSupabaseMock([], 0)
    vi.mocked(createClient).mockResolvedValue(supabase as any)
    const req = new NextRequest('http://localhost/api/products?sort=price-asc')
    const res = await GET(req)
    expect(res.status).toBe(200)
  })

  it('handles sort=price-desc param', async () => {
    const supabase = makeSupabaseMock([], 0)
    vi.mocked(createClient).mockResolvedValue(supabase as any)
    const req = new NextRequest('http://localhost/api/products?sort=price-desc')
    const res = await GET(req)
    expect(res.status).toBe(200)
  })

  it('handles sort=name param', async () => {
    const supabase = makeSupabaseMock([], 0)
    vi.mocked(createClient).mockResolvedValue(supabase as any)
    const req = new NextRequest('http://localhost/api/products?sort=name')
    const res = await GET(req)
    expect(res.status).toBe(200)
  })

  it('handles min/max price filters', async () => {
    const supabase = makeSupabaseMock([], 0)
    vi.mocked(createClient).mockResolvedValue(supabase as any)
    const req = new NextRequest('http://localhost/api/products?min=100&max=5000')
    const res = await GET(req)
    expect(res.status).toBe(200)
  })

  it('handles featured=true filter', async () => {
    const supabase = makeSupabaseMock([], 0)
    vi.mocked(createClient).mockResolvedValue(supabase as any)
    const req = new NextRequest('http://localhost/api/products?featured=true')
    const res = await GET(req)
    expect(res.status).toBe(200)
  })

  it('handles pagination params', async () => {
    const supabase = makeSupabaseMock([], 0)
    vi.mocked(createClient).mockResolvedValue(supabase as any)
    const req = new NextRequest('http://localhost/api/products?page=2&limit=10')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.pagination.page).toBe(2)
    expect(json.pagination.limit).toBe(10)
  })

  it('returns 500 on unexpected exception', async () => {
    vi.mocked(createClient).mockRejectedValue(new Error('crash'))
    const req = new NextRequest('http://localhost/api/products')
    const res = await GET(req)
    expect(res.status).toBe(500)
  })
})
