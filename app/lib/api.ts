// Helper function for API paths that works with base path
export function getApiPath(path: string): string {
  // Base path wird automatisch von Next.js hinzugefügt, wenn basePath in next.config.js gesetzt ist
  // Für API-Aufrufe müssen wir den basePath manuell hinzufügen
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/SYNO"
  // Entferne führenden Slash vom Pfad, wenn basePath bereits einen hat
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return `${basePath}${cleanPath}`
}

