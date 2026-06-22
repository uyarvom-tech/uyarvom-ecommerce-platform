import { describe, it, expect } from 'vitest'
import {
  generateEAN13FromSKU,
  renderEAN13SVG,
  renderQRCodeSVG,
  generateProductBarcode,
} from '@/lib/barcode'

describe('Barcode Generation', () => {
  describe('generateEAN13FromSKU', () => {
    it('returns a 13-digit string', () => {
      const ean = generateEAN13FromSKU('UYV-BOWL-001')
      expect(ean).toHaveLength(13)
      expect(/^\d{13}$/.test(ean)).toBe(true)
    })

    it('starts with India country prefix 890', () => {
      const ean = generateEAN13FromSKU('UYV-POT-123')
      expect(ean.startsWith('890')).toBe(true)
    })

    it('produces consistent output for same SKU', () => {
      const ean1 = generateEAN13FromSKU('UYV-TAWA-005')
      const ean2 = generateEAN13FromSKU('UYV-TAWA-005')
      expect(ean1).toBe(ean2)
    })

    it('produces different output for different SKUs', () => {
      const ean1 = generateEAN13FromSKU('UYV-BOWL-001')
      const ean2 = generateEAN13FromSKU('UYV-PLATE-002')
      expect(ean1).not.toBe(ean2)
    })

    it('has a valid check digit', () => {
      const ean = generateEAN13FromSKU('UYV-TEST-999')
      const digits = ean.split('').map(Number)
      const sum = digits.slice(0, 12).reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0)
      const expectedCheck = (10 - (sum % 10)) % 10
      expect(digits[12]).toBe(expectedCheck)
    })

    it('handles empty string SKU gracefully', () => {
      const ean = generateEAN13FromSKU('')
      expect(ean).toHaveLength(13)
      expect(/^\d{13}$/.test(ean)).toBe(true)
    })

    it('handles special characters in SKU', () => {
      const ean = generateEAN13FromSKU('UYV/BOWL@#$%^&*()')
      expect(ean).toHaveLength(13)
      expect(/^\d{13}$/.test(ean)).toBe(true)
    })
  })

  describe('renderEAN13SVG', () => {
    it('returns valid SVG string', () => {
      const ean = generateEAN13FromSKU('UYV-TEST-001')
      const svg = renderEAN13SVG(ean)
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    })

    it('includes the EAN number as text', () => {
      const ean = generateEAN13FromSKU('UYV-TEST-001')
      const svg = renderEAN13SVG(ean)
      expect(svg).toContain(ean)
    })

    it('throws for invalid length input', () => {
      expect(() => renderEAN13SVG('123')).toThrow('EAN-13 must be exactly 13 digits')
    })

    it('respects custom width and height', () => {
      const ean = generateEAN13FromSKU('UYV-TEST-001')
      const svg = renderEAN13SVG(ean, { width: 300, height: 100 })
      expect(svg).toContain('width="300"')
      expect(svg).toContain('height="100"')
    })

    it('contains bar rectangles', () => {
      const ean = generateEAN13FromSKU('UYV-TEST-001')
      const svg = renderEAN13SVG(ean)
      expect(svg).toContain('<rect')
      expect(svg).toContain('fill="black"')
    })
  })

  describe('renderQRCodeSVG', () => {
    it('returns valid SVG string', () => {
      const svg = renderQRCodeSVG('https://uyarvom.com/products/test-bowl')
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
    })

    it('respects size option', () => {
      const svg = renderQRCodeSVG('test', { size: 250 })
      expect(svg).toContain('width="250"')
      expect(svg).toContain('height="250"')
    })

    it('produces different patterns for different data', () => {
      const svg1 = renderQRCodeSVG('product-a')
      const svg2 = renderQRCodeSVG('product-b')
      expect(svg1).not.toBe(svg2)
    })

    it('contains finder patterns (black rects)', () => {
      const svg = renderQRCodeSVG('test-data')
      expect(svg).toContain('fill="black"')
    })
  })

  describe('generateProductBarcode', () => {
    it('returns all three pieces of barcode data', () => {
      const result = generateProductBarcode('UYV-BOWL-001', 'https://uyarvom.com/products/bowl')
      expect(result).toHaveProperty('ean13')
      expect(result).toHaveProperty('barcodeSVG')
      expect(result).toHaveProperty('qrCodeSVG')
    })

    it('ean13 is valid 13-digit string', () => {
      const result = generateProductBarcode('UYV-POT-123')
      expect(result.ean13).toHaveLength(13)
    })

    it('SVGs are valid', () => {
      const result = generateProductBarcode('UYV-PLATE-007', 'https://uyarvom.com/products/plate')
      expect(result.barcodeSVG).toContain('<svg')
      expect(result.qrCodeSVG).toContain('<svg')
    })

    it('works without productUrl (uses SKU)', () => {
      const result = generateProductBarcode('UYV-TAWA-042')
      expect(result.qrCodeSVG).toContain('<svg')
    })
  })
})
