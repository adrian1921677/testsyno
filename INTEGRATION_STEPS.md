# SYNO als Route `/syno` in Hauptprojekt integrieren

## Schritt-für-Schritt Anleitung

### Schritt 1: Dateien in Hauptprojekt kopieren

Kopiere folgende Ordner/Dateien von SYNO in dein Hauptprojekt:

```
SYNO/                                    →    Hauptprojekt/
├── app/
│   ├── components/                      →    app/syno/components/
│   ├── lib/                             →    app/syno/lib/
│   ├── globals.css                      →    app/syno/globals.css (optional)
│   ├── layout.tsx                       →    app/syno/layout.tsx
│   └── page.tsx                         →    app/syno/page.tsx
├── components/ui/                       →    components/ui/ (falls noch nicht vorhanden)
├── lib/utils.ts                         →    lib/utils.ts (falls noch nicht vorhanden)
└── public/assets/                       →    public/assets/ (falls benötigt)
```

### Schritt 2: API Routes kopieren und anpassen

Kopiere die API Routes:

```
SYNO/app/api/                            →    Hauptprojekt/app/api/syno/
├── feedback/route.ts                    →    api/syno/feedback/route.ts
├── google-vision/route.ts               →    api/syno/google-vision/route.ts
└── mathpix/route.ts                     →    api/syno/mathpix/route.ts
```

### Schritt 3: API-Pfade in Komponenten anpassen

In folgenden Dateien müssen die API-Pfade geändert werden:

**1. `app/syno/components/CameraCapture.tsx`:**
- Zeile 606: `/api/google-vision` → `/api/syno/google-vision`
- Zeile 640: `/api/mathpix` → `/api/syno/mathpix`

**2. `app/syno/components/FeedbackFab.tsx`:**
- Zeile 29: `/api/feedback` → `/api/syno/feedback`

### Schritt 4: Imports anpassen

In `app/syno/page.tsx` und anderen Komponenten müssen die Imports angepasst werden:

```typescript
// Vorher:
import { Input } from "@/components/ui/input"

// Nachher (wenn components/ui im Root liegt):
import { Input } from "@/components/ui/input"

// Oder (wenn components/ui in syno liegt):
import { Input } from "../components/ui/input"
```

### Schritt 5: Link auf Hauptseite hinzufügen

In deiner Hauptseite (`app/page.tsx` oder Navigation):

```tsx
import Link from 'next/link'

<Link href="/syno">SYNO Taschenrechner</Link>
```

### Schritt 6: Environment Variables

Stelle sicher, dass die Environment Variables im Hauptprojekt gesetzt sind:

```env
GOOGLE_VISION_API_KEY=...
MATHPIX_APP_ID=...
MATHPIX_APP_KEY=...
RESEND_API_KEY=...
FEEDBACK_TO=...
```

## Automatische Anpassung der API-Pfade

Ich kann die API-Pfade automatisch anpassen. Soll ich das jetzt machen?

**Gib mir bitte:**
1. Den Pfad zu deinem Hauptprojekt (z.B. `C:\Users\adria\Desktop\Projekte\Intern\Adrian-Adullahu\Hauptprojekt`)
2. Oder sag mir, wenn ich die Dateien hier vorbereiten soll, damit du sie dann kopieren kannst

