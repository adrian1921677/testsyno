# SYNO Integration - Checkliste

## ✅ Bereits erledigt
- API-Pfade in Komponenten angepasst auf `/api/syno/...`
  - `CameraCapture.tsx`: `/api/syno/google-vision` und `/api/syno/mathpix`
  - `FeedbackFab.tsx`: `/api/syno/feedback`

## 📋 Nächste Schritte

### 1. Dateien in Hauptprojekt kopieren

**Struktur im Hauptprojekt:**
```
dein-hauptprojekt/
├── app/
│   ├── syno/                          ← NEU
│   │   ├── page.tsx                   (aus SYNO/app/page.tsx)
│   │   ├── layout.tsx                 (aus SYNO/app/layout.tsx)
│   │   ├── components/                (aus SYNO/app/components/)
│   │   └── lib/                       (aus SYNO/app/lib/)
│   └── api/
│       └── syno/                      ← NEU
│           ├── feedback/
│           │   └── route.ts           (aus SYNO/app/api/feedback/route.ts)
│           ├── google-vision/
│           │   └── route.ts          (aus SYNO/app/api/google-vision/route.ts)
│           └── mathpix/
│               └── route.ts          (aus SYNO/app/api/mathpix/route.ts)
├── components/
│   └── ui/                           (aus SYNO/components/ui/ - falls noch nicht vorhanden)
└── lib/
    └── utils.ts                      (aus SYNO/lib/utils.ts - falls noch nicht vorhanden)
```

### 2. Kopier-Befehle (PowerShell)

```powershell
# Navigiere zu deinem Hauptprojekt
cd C:\Pfad\zu\deinem\Hauptprojekt

# Erstelle Ordnerstruktur
New-Item -ItemType Directory -Force -Path "app\syno"
New-Item -ItemType Directory -Force -Path "app\api\syno"

# Kopiere Dateien
Copy-Item -Path "C:\Users\adria\Desktop\Projekte\Intern\Adrian-Adullahu\SYNO\app\page.tsx" -Destination "app\syno\page.tsx"
Copy-Item -Path "C:\Users\adria\Desktop\Projekte\Intern\Adrian-Adullahu\SYNO\app\layout.tsx" -Destination "app\syno\layout.tsx"
Copy-Item -Path "C:\Users\adria\Desktop\Projekte\Intern\Adrian-Adullahu\SYNO\app\components" -Destination "app\syno\components" -Recurse
Copy-Item -Path "C:\Users\adria\Desktop\Projekte\Intern\Adrian-Adullahu\SYNO\app\lib" -Destination "app\syno\lib" -Recurse
Copy-Item -Path "C:\Users\adria\Desktop\Projekte\Intern\Adrian-Adullahu\SYNO\app\api\feedback" -Destination "app\api\syno\feedback" -Recurse
Copy-Item -Path "C:\Users\adria\Desktop\Projekte\Intern\Adrian-Adullahu\SYNO\app\api\google-vision" -Destination "app\api\syno\google-vision" -Recurse
Copy-Item -Path "C:\Users\adria\Desktop\Projekte\Intern\Adrian-Adullahu\SYNO\app\api\mathpix" -Destination "app\api\syno\mathpix" -Recurse
```

### 3. Imports prüfen

Stelle sicher, dass die Imports in `app/syno/page.tsx` korrekt sind:
- `@/components/ui/...` sollte funktionieren, wenn `components/ui` im Root liegt
- Falls nicht, passe die Imports entsprechend an

### 4. Link auf Hauptseite hinzufügen

In deiner Hauptseite (`app/page.tsx`):

```tsx
import Link from 'next/link'

export default function HomePage() {
  return (
    <div>
      {/* Dein bestehender Inhalt */}
      
      <Link href="/syno">
        <button>SYNO Taschenrechner</button>
      </Link>
    </div>
  )
}
```

### 5. Environment Variables

Stelle sicher, dass in deinem Hauptprojekt `.env.local` die Variablen enthält:

```env
GOOGLE_VISION_API_KEY=...
MATHPIX_APP_ID=...
MATHPIX_APP_KEY=...
RESEND_API_KEY=...
FEEDBACK_TO=...
```

### 6. Dependencies prüfen

Stelle sicher, dass alle Dependencies aus `SYNO/package.json` auch in deinem Hauptprojekt vorhanden sind:

```json
{
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "framer-motion": "^12.23.24",
    "lucide-react": "^0.548.0",
    "mathjs": "^15.0.0",
    "resend": "^6.3.0",
    "tailwind-merge": "^3.3.1",
    "tailwindcss-animate": "^1.0.7",
    "tesseract.js": "^6.0.1",
    "zod": "^4.1.12",
    "zustand": "^5.0.8"
  }
}
```

## 🎯 Testen

1. Starte dein Hauptprojekt: `npm run dev`
2. Gehe zu `http://localhost:3000/syno`
3. Teste die Funktionen (Berechnungen, OCR, Feedback)

## ❓ Hilfe

Wenn du Probleme hast:
- Prüfe die Console auf Fehler
- Stelle sicher, dass alle Dependencies installiert sind
- Prüfe, ob die API-Routes unter `/api/syno/` erreichbar sind

