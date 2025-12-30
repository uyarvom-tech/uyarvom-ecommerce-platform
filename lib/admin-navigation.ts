/**
 * Utility functions for admin-aware navigation
 */

/**
 * Adds ?admin=true parameter to a URL if we're currently in admin view
 */
export function getAdminAwareUrl(baseUrl: string, searchParams?: URLSearchParams): string {
  const isFromAdmin = searchParams?.get('admin') === 'true'
  
  if (!isFromAdmin) {
    return baseUrl
  }
  
  // Check if baseUrl already has query parameters
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}admin=true`
}

/**
 * Hook-like function to get admin-aware URLs (for client components)
 */
export function useAdminAwareUrl(baseUrl: string): string {
  if (typeof window === 'undefined') {
    return baseUrl
  }
  
  const urlParams = new URLSearchParams(window.location.search)
  return getAdminAwareUrl(baseUrl, urlParams)
}