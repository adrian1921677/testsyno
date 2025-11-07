// Helper function for API paths that works with base path
export function getApiPath(path: string): string {
  // Für Subdomain syno.abdullahu-adrian.de wird kein Base Path benötigt
  // Falls du später abdullahu-adrian.de/SYNO verwenden willst, setze basePath hier
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
  // Entferne führenden Slash vom Pfad, wenn basePath bereits einen hat
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return basePath ? `${basePath}${cleanPath}` : cleanPath
}

