// Helper function for API paths that works with base path
export function getApiPath(path: string): string {
  // In production, if SYNO is under /syno route, use that base path
  // You can set this via environment variable or detect from window.location
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
  return `${basePath}${path}`
}

