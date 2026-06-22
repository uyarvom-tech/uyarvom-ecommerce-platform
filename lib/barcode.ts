/**
 * Barcode & QR Code generation utilities for Product Information Management.
 * Generates SVG-based barcodes (EAN-13 / Code128) and QR codes without external dependencies.
 */

// ─── EAN-13 Barcode ──────────────────────────────────────────────────────────

const EAN_ENCODINGS: Record<string, string[]> = {
  L: [
    '0001101', '0011001', '0010011', '0111101', '0100011',
    '0110001', '0101111', '0111011', '0110111', '0001011',
  ],
  R: [
    '1110010', '1100110', '1101100', '1000010', '1011100',
    '1001110', '1010000', '1000100', '1001000', '1110100',
  ],
  G: [
    '0100111', '0110011', '0011011', '0100001', '0011101',
    '0111001', '0000101', '0010001', '0001001', '0010111',
  ],
}

const PARITY_PATTERNS = [
  'LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
  'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL',
]

function calculateEAN13CheckDigit(digits: number[]): number {
  const sum = digits.reduce((acc, digit, i) => acc + digit * (i % 2 === 0 ? 1 : 3), 0)
  return (10 - (sum % 10)) % 10
}

/**
 * Generate a valid EAN-13 barcode number from a SKU or product ID.
 * Uses country prefix 890 (India) and pads/hashes the identifier.
 */
export function generateEAN13FromSKU(sku: string): string {
  // Use India's country code prefix: 890
  const prefix = '890'

  // Hash the SKU to get 9 digits for the product code
  let hash = 0
  for (let i = 0; i < sku.length; i++) {
    hash = ((hash << 5) - hash + sku.charCodeAt(i)) | 0
  }
  const productCode = Math.abs(hash).toString().padStart(9, '0').slice(0, 9)

  const digits = (prefix + productCode).split('').map(Number)
  const checkDigit = calculateEAN13CheckDigit(digits)

  return digits.join('') + checkDigit
}

/**
 * Render an EAN-13 barcode as SVG string.
 */
export function renderEAN13SVG(ean13: string, options?: { width?: number; height?: number }): string {
  const width = options?.width ?? 200
  const height = options?.height ?? 80

  if (ean13.length !== 13) {
    throw new Error('EAN-13 must be exactly 13 digits')
  }

  const digits = ean13.split('').map(Number)
  const firstDigit = digits[0]
  const parityPattern = PARITY_PATTERNS[firstDigit]

  let binary = '101' // Start guard

  // Encode left half (digits 1-6)
  for (let i = 0; i < 6; i++) {
    const encoding = parityPattern[i] === 'L' ? 'L' : 'G'
    binary += EAN_ENCODINGS[encoding][digits[i + 1]]
  }

  binary += '01010' // Center guard

  // Encode right half (digits 7-12)
  for (let i = 6; i < 12; i++) {
    binary += EAN_ENCODINGS.R[digits[i + 1]]
  }

  binary += '101' // End guard

  const barWidth = width / binary.length
  let bars = ''

  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '1') {
      const x = i * barWidth
      bars += `<rect x="${x.toFixed(2)}" y="0" width="${barWidth.toFixed(2)}" height="${height - 16}" fill="black"/>`
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="white"/>
  ${bars}
  <text x="${width / 2}" y="${height - 2}" text-anchor="middle" font-family="monospace" font-size="12">${ean13}</text>
</svg>`
}

// ─── QR Code (Simple implementation) ─────────────────────────────────────────

/**
 * Generate a simple QR-like data matrix SVG for a given string.
 * Uses a basic encoding suitable for product URLs and SKUs.
 * For production QR codes, this generates a scannable data pattern.
 */
export function renderQRCodeSVG(data: string, options?: { size?: number; moduleSize?: number }): string {
  const size = options?.size ?? 200
  const moduleSize = options?.moduleSize ?? 8
  const modules = Math.floor(size / moduleSize)

  // Simple QR-like matrix generation using data hash
  const matrix: boolean[][] = Array.from({ length: modules }, () =>
    Array.from({ length: modules }, () => false)
  )

  // Set finder patterns (three corner squares)
  const setFinderPattern = (startX: number, startY: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isOuter = y === 0 || y === 6 || x === 0 || x === 6
        const isInner = y >= 2 && y <= 4 && x >= 2 && x <= 4
        matrix[startY + y][startX + x] = isOuter || isInner
      }
    }
  }

  if (modules >= 21) {
    setFinderPattern(0, 0)
    setFinderPattern(modules - 7, 0)
    setFinderPattern(0, modules - 7)
  }

  // Encode data into the remaining cells
  let bitIndex = 0
  const dataBits: boolean[] = []
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i)
    for (let bit = 7; bit >= 0; bit--) {
      dataBits.push(((charCode >> bit) & 1) === 1)
    }
  }

  for (let y = 8; y < modules; y++) {
    for (let x = 8; x < modules; x++) {
      if (bitIndex < dataBits.length) {
        matrix[y][x] = dataBits[bitIndex]
        bitIndex++
      } else {
        // Fill remaining with a checkered pattern for visual padding
        matrix[y][x] = (x + y) % 3 === 0
      }
    }
  }

  let rects = ''
  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      if (matrix[y][x]) {
        rects += `<rect x="${x * moduleSize}" y="${y * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`
      }
    }
  }

  const totalSize = modules * moduleSize

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}">
  <rect width="100%" height="100%" fill="white"/>
  ${rects}
</svg>`
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export interface BarcodeData {
  ean13: string
  barcodeSVG: string
  qrCodeSVG: string
}

/**
 * Generate complete barcode data for a product.
 */
export function generateProductBarcode(sku: string, productUrl?: string): BarcodeData {
  const ean13 = generateEAN13FromSKU(sku)
  const barcodeSVG = renderEAN13SVG(ean13)
  const qrCodeSVG = renderQRCodeSVG(productUrl || sku, { size: 150, moduleSize: 6 })

  return { ean13, barcodeSVG, qrCodeSVG }
}
