# Deployment-Konfiguration für SYNO

## Base Path: `/SYNO`

Die App ist so konfiguriert, dass sie unter `abdullahu-adrian.de/SYNO` läuft.

### Konfiguration

Die Base Path-Konfiguration erfolgt in `next.config.js`:

```javascript
const nextConfig = {
  basePath: '/SYNO',
}
```

### Wichtige Hinweise

1. **Next.js fügt den Base Path automatisch hinzu**: Alle Routen, Assets und Links werden automatisch mit `/SYNO` vorangestellt.

2. **API-Routen**: Die API-Routen sind unter `/SYNO/api/` erreichbar:
   - `/SYNO/api/feedback`
   - `/SYNO/api/google-vision`
   - `/SYNO/api/mathpix`

3. **Umgebungsvariablen**: Optional kannst du den Base Path über eine Umgebungsvariable überschreiben:
   ```env
   NEXT_PUBLIC_BASE_PATH=/SYNO
   ```

### Deployment

Nach dem Build und Deployment sollte die App unter `https://abdullahu-adrian.de/SYNO` erreichbar sein.

### Entwicklung

Im Development-Modus läuft die App weiterhin auf `http://localhost:3000/SYNO`.

### Server-Konfiguration

Stelle sicher, dass dein Webserver (z.B. Nginx, Apache) so konfiguriert ist, dass:
- Requests zu `/SYNO` an die Next.js-App weitergeleitet werden
- Statische Assets unter `/SYNO/_next/` erreichbar sind



