/**
 * Enhanced User Management — Core business logic
 * OTP generation, token management, account creation for all roles,
 * password reset, impersonation, and rate limiting for auth.
 */

// ─── OTP ─────────────────────────────────────────────────────────────────────

export interface OTPRecord {
  code: string
  email: string
  expiresAt: Date
  used: boolean
}

/**
 * Generate a 6-digit numeric OTP.
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Check if OTP is valid (not expired, not used).
 */
export function validateOTP(record: OTPRecord, inputCode: string): { valid: boolean; error?: string } {
  if (record.used) return { valid: false, error: 'OTP has already been used' }
  if (new Date() > record.expiresAt) return { valid: false, error: 'OTP has expired' }
  if (record.code !== inputCode) return { valid: false, error: 'Invalid OTP code' }
  return { valid: true }
}

/**
 * Get OTP expiry time (10 minutes from now).
 */
export function getOTPExpiry(): Date {
  return new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
}

// ─── Password Reset ──────────────────────────────────────────────────────────

export interface PasswordResetToken {
  token: string
  email: string
  expiresAt: Date
  used: boolean
}

/**
 * Generate a password reset token (URL-safe random string).
 */
export function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

/**
 * Get reset token expiry (24 hours from now).
 */
export function getResetTokenExpiry(): Date {
  return new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
}

/**
 * Validate a reset token.
 */
export function validateResetToken(record: PasswordResetToken, inputToken: string): { valid: boolean; error?: string } {
  if (record.used) return { valid: false, error: 'Reset link has already been used' }
  if (new Date() > record.expiresAt) return { valid: false, error: 'Reset link has expired (24-hour limit)' }
  if (record.token !== inputToken) return { valid: false, error: 'Invalid reset token' }
  return { valid: true }
}

// ─── Auth Rate Limiting ──────────────────────────────────────────────────────

const loginAttempts = new Map<string, { count: number; lockedUntil: Date | null }>()

const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

/**
 * Check if login is rate-limited for this identifier (email/IP).
 */
export function checkLoginRateLimit(identifier: string): { allowed: boolean; remainingAttempts: number; lockedUntil?: Date } {
  const record = loginAttempts.get(identifier)

  if (!record) return { allowed: true, remainingAttempts: MAX_ATTEMPTS }

  if (record.lockedUntil && new Date() < record.lockedUntil) {
    return { allowed: false, remainingAttempts: 0, lockedUntil: record.lockedUntil }
  }

  // Reset if lockout expired
  if (record.lockedUntil && new Date() >= record.lockedUntil) {
    loginAttempts.delete(identifier)
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.count }
}

/**
 * Record a failed login attempt. Returns lockout info if threshold reached.
 */
export function recordFailedLogin(identifier: string): { locked: boolean; lockedUntil?: Date } {
  const record = loginAttempts.get(identifier) || { count: 0, lockedUntil: null }
  record.count += 1

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
    loginAttempts.set(identifier, record)
    return { locked: true, lockedUntil: record.lockedUntil }
  }

  loginAttempts.set(identifier, record)
  return { locked: false }
}

/**
 * Clear login attempts on successful login.
 */
export function clearLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier)
}

// ─── Account Creation Validation ─────────────────────────────────────────────

export interface CreateAccountInput {
  email: string
  fullName: string
  phone?: string
  role: string
  vehicleType?: string // For couriers
  serviceArea?: string // For couriers
}

/**
 * Validate account creation input.
 */
export function validateAccountInput(input: CreateAccountInput): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.push('Valid email is required')
  }

  if (!input.fullName || input.fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters')
  }

  if (input.phone && !/^\+?[\d\s-]{8,15}$/.test(input.phone)) {
    errors.push('Invalid phone number format')
  }

  if (!input.role) {
    errors.push('Role is required')
  }

  if (input.role === 'courier') {
    if (!input.vehicleType) errors.push('Vehicle type is required for couriers')
    if (!input.serviceArea) errors.push('Service area is required for couriers')
  }

  return { valid: errors.length === 0, errors }
}

// ─── Impersonation ───────────────────────────────────────────────────────────

export interface ImpersonationLog {
  actorId: string
  targetUserId: string
  startedAt: Date
  endedAt?: Date
  reason: string
}

/**
 * Validate impersonation is allowed (only super_admin can impersonate).
 */
export function canImpersonate(actorRole: string): { allowed: boolean; error?: string } {
  if (actorRole !== 'super_admin') {
    return { allowed: false, error: 'Only Super Admin can impersonate users' }
  }
  return { allowed: true }
}

// ─── Session / Token Config ──────────────────────────────────────────────────

export const TOKEN_CONFIG = {
  accessTokenExpiry: 15 * 60, // 15 minutes in seconds
  refreshTokenExpiry: 7 * 24 * 60 * 60, // 7 days in seconds
  otpExpiry: 10 * 60, // 10 minutes in seconds
  resetTokenExpiry: 24 * 60 * 60, // 24 hours in seconds
  maxLoginAttempts: MAX_ATTEMPTS,
  lockoutMinutes: LOCKOUT_MINUTES,
}

// ─── Temporary Password for Courier ──────────────────────────────────────────

/**
 * Generate a temporary password for courier first-login.
 */
export function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pass = ''
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pass
}
