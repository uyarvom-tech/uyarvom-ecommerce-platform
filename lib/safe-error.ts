/**
 * Safe error response utility.
 * Prevents internal details (DB errors, stack traces) from leaking to clients.
 */

/**
 * Sanitize an error for client-facing response.
 * In production, returns a generic message. In dev, returns the actual error.
 */
export function safeErrorMessage(error: unknown, fallback: string = 'An unexpected error occurred'): string {
  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error) return error.message
    return String(error)
  }

  // In production, check if the error is a known "safe" user-facing error
  if (error instanceof Error) {
    const msg = error.message

    // These patterns are safe to show to users
    const safePatterns = [
      /insufficient stock/i,
      /not found/i,
      /already exists/i,
      /required/i,
      /invalid/i,
      /unauthorized/i,
      /forbidden/i,
      /cannot/i,
      /must be/i,
      /minimum/i,
      /maximum/i,
      /expired/i,
      /limit/i,
    ]

    if (safePatterns.some(pattern => pattern.test(msg))) {
      return msg
    }
  }

  return fallback
}
