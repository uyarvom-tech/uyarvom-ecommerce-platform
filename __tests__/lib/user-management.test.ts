import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateOTP,
  validateOTP,
  getOTPExpiry,
  generateResetToken,
  getResetTokenExpiry,
  validateResetToken,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
  validateAccountInput,
  canImpersonate,
  generateTempPassword,
  TOKEN_CONFIG,
} from '@/lib/user-management'

describe('User Management', () => {
  describe('OTP Generation & Validation', () => {
    it('generates a 6-digit numeric OTP', () => {
      const otp = generateOTP()
      expect(otp).toHaveLength(6)
      expect(/^\d{6}$/.test(otp)).toBe(true)
    })

    it('generates different OTPs each time', () => {
      const otps = new Set(Array.from({ length: 10 }, () => generateOTP()))
      expect(otps.size).toBeGreaterThan(1)
    })

    it('validates correct OTP', () => {
      const record = { code: '123456', email: 'test@test.com', expiresAt: new Date(Date.now() + 60000), used: false }
      expect(validateOTP(record, '123456').valid).toBe(true)
    })

    it('rejects wrong OTP code', () => {
      const record = { code: '123456', email: 'test@test.com', expiresAt: new Date(Date.now() + 60000), used: false }
      const result = validateOTP(record, '654321')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid')
    })

    it('rejects expired OTP', () => {
      const record = { code: '123456', email: 'test@test.com', expiresAt: new Date(Date.now() - 1000), used: false }
      const result = validateOTP(record, '123456')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('expired')
    })

    it('rejects used OTP', () => {
      const record = { code: '123456', email: 'test@test.com', expiresAt: new Date(Date.now() + 60000), used: true }
      const result = validateOTP(record, '123456')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('already been used')
    })

    it('OTP expiry is 10 minutes from now', () => {
      const expiry = getOTPExpiry()
      const diff = expiry.getTime() - Date.now()
      expect(diff).toBeGreaterThan(9 * 60 * 1000)
      expect(diff).toBeLessThanOrEqual(10 * 60 * 1000)
    })
  })

  describe('Password Reset Token', () => {
    it('generates a 64-character token', () => {
      const token = generateResetToken()
      expect(token).toHaveLength(64)
      expect(/^[A-Za-z0-9]+$/.test(token)).toBe(true)
    })

    it('generates unique tokens', () => {
      const t1 = generateResetToken()
      const t2 = generateResetToken()
      expect(t1).not.toBe(t2)
    })

    it('reset token expiry is 24 hours', () => {
      const expiry = getResetTokenExpiry()
      const diff = expiry.getTime() - Date.now()
      expect(diff).toBeGreaterThan(23 * 60 * 60 * 1000)
      expect(diff).toBeLessThanOrEqual(24 * 60 * 60 * 1000)
    })

    it('validates correct token', () => {
      const token = 'abc123'
      const record = { token, email: 'test@test.com', expiresAt: new Date(Date.now() + 60000), used: false }
      expect(validateResetToken(record, 'abc123').valid).toBe(true)
    })

    it('rejects expired token', () => {
      const record = { token: 'abc', email: 'test@test.com', expiresAt: new Date(Date.now() - 1000), used: false }
      expect(validateResetToken(record, 'abc').valid).toBe(false)
    })

    it('rejects used token', () => {
      const record = { token: 'abc', email: 'test@test.com', expiresAt: new Date(Date.now() + 60000), used: true }
      expect(validateResetToken(record, 'abc').valid).toBe(false)
    })
  })

  describe('Login Rate Limiting', () => {
    beforeEach(() => {
      clearLoginAttempts('test@test.com')
    })

    it('allows first login attempt', () => {
      const result = checkLoginRateLimit('fresh@test.com')
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(5)
    })

    it('tracks failed attempts', () => {
      recordFailedLogin('test@test.com')
      recordFailedLogin('test@test.com')
      const result = checkLoginRateLimit('test@test.com')
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(3)
    })

    it('locks after 5 failed attempts', () => {
      for (let i = 0; i < 5; i++) recordFailedLogin('test@test.com')
      const result = checkLoginRateLimit('test@test.com')
      expect(result.allowed).toBe(false)
      expect(result.remainingAttempts).toBe(0)
      expect(result.lockedUntil).toBeDefined()
    })

    it('recordFailedLogin returns locked=true at threshold', () => {
      for (let i = 0; i < 4; i++) recordFailedLogin('test@test.com')
      const result = recordFailedLogin('test@test.com') // 5th attempt
      expect(result.locked).toBe(true)
      expect(result.lockedUntil).toBeDefined()
    })

    it('clearLoginAttempts resets the counter', () => {
      for (let i = 0; i < 3; i++) recordFailedLogin('test@test.com')
      clearLoginAttempts('test@test.com')
      const result = checkLoginRateLimit('test@test.com')
      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(5)
    })
  })

  describe('Account Validation', () => {
    it('validates correct customer input', () => {
      const result = validateAccountInput({ email: 'user@test.com', fullName: 'John Doe', role: 'customer' })
      expect(result.valid).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = validateAccountInput({ email: 'notanemail', fullName: 'John', role: 'customer' })
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('email')
    })

    it('rejects empty name', () => {
      const result = validateAccountInput({ email: 'a@b.com', fullName: '', role: 'admin' })
      expect(result.valid).toBe(false)
    })

    it('rejects short name', () => {
      const result = validateAccountInput({ email: 'a@b.com', fullName: 'A', role: 'admin' })
      expect(result.valid).toBe(false)
    })

    it('rejects courier without vehicle type', () => {
      const result = validateAccountInput({ email: 'c@b.com', fullName: 'Courier', role: 'courier' })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Vehicle type is required for couriers')
    })

    it('rejects courier without service area', () => {
      const result = validateAccountInput({ email: 'c@b.com', fullName: 'Courier', role: 'courier', vehicleType: 'Bike' })
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Service area is required for couriers')
    })

    it('validates correct courier input', () => {
      const result = validateAccountInput({ email: 'c@b.com', fullName: 'Courier', role: 'courier', vehicleType: 'Bike', serviceArea: 'Chennai' })
      expect(result.valid).toBe(true)
    })

    it('validates phone number format', () => {
      const valid = validateAccountInput({ email: 'a@b.com', fullName: 'Test', role: 'admin', phone: '+91 98765 43210' })
      expect(valid.valid).toBe(true)

      const invalid = validateAccountInput({ email: 'a@b.com', fullName: 'Test', role: 'admin', phone: '123' })
      expect(invalid.valid).toBe(false)
    })
  })

  describe('Impersonation', () => {
    it('allows super_admin to impersonate', () => {
      expect(canImpersonate('super_admin').allowed).toBe(true)
    })

    it('denies admin from impersonating', () => {
      const result = canImpersonate('admin')
      expect(result.allowed).toBe(false)
      expect(result.error).toContain('Super Admin')
    })

    it('denies all other roles', () => {
      expect(canImpersonate('manager').allowed).toBe(false)
      expect(canImpersonate('courier').allowed).toBe(false)
      expect(canImpersonate('customer').allowed).toBe(false)
    })
  })

  describe('Temp Password', () => {
    it('generates a 10-character password', () => {
      const pass = generateTempPassword()
      expect(pass).toHaveLength(10)
    })

    it('generates unique passwords', () => {
      const p1 = generateTempPassword()
      const p2 = generateTempPassword()
      expect(p1).not.toBe(p2)
    })

    it('excludes ambiguous characters (0, O, l, I, 1)', () => {
      // Generate many and check none contain ambiguous chars
      for (let i = 0; i < 50; i++) {
        const pass = generateTempPassword()
        expect(pass).not.toMatch(/[0OlI1]/)
      }
    })
  })

  describe('Token Config', () => {
    it('access token expires in 15 minutes', () => {
      expect(TOKEN_CONFIG.accessTokenExpiry).toBe(900)
    })

    it('refresh token expires in 7 days', () => {
      expect(TOKEN_CONFIG.refreshTokenExpiry).toBe(604800)
    })

    it('OTP expires in 10 minutes', () => {
      expect(TOKEN_CONFIG.otpExpiry).toBe(600)
    })

    it('reset token expires in 24 hours', () => {
      expect(TOKEN_CONFIG.resetTokenExpiry).toBe(86400)
    })

    it('max login attempts is 5', () => {
      expect(TOKEN_CONFIG.maxLoginAttempts).toBe(5)
    })

    it('lockout is 15 minutes', () => {
      expect(TOKEN_CONFIG.lockoutMinutes).toBe(15)
    })
  })
})
