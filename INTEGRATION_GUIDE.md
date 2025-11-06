# SYNO als Route unter Hauptseite integrieren

## Option A: SYNO in bestehendes Next.js-Projekt integrieren

Wenn du bereits ein Next.js-Hauptprojekt hast, kannst du SYNO als Route `/syno` integrieren:

### Schritt 1: SYNO-Ordnerstruktur in Hauptprojekt kopieren

```
dein-hauptprojekt/
├── app/
│   ├── page.tsx                    # Hauptseite
│   ├── syno/                       # SYNO Route
│   │   ├── page.tsx                # SYNO Hauptseite (aus app/page.tsx kopieren)
│   │   ├── layout.tsx              # SYNO Layout (aus app/layout.tsx kopieren)
│   │   ├── components/             # SYNO Komponenten
│   │   ├── lib/                    # SYNO Libraries
│   │   └── api/                    # SYNO API Routes
│   └── ...
├── components/
│   └── ui/                         # Shared UI Components
└── ...
```

### Schritt 2: API Routes anpassen

Die API Routes müssen unter `/api/syno/` liegen:

```
app/
└── api/
    └── syno/
        ├── feedback/
        │   └── route.ts
        ├── google-vision/
        │   └── route.ts
        └── mathpix/
            └── route.ts
```

### Schritt 3: Pfade in Komponenten anpassen

In den Komponenten müssen die API-Pfade angepasst werden:
- `/api/google-vision` → `/api/syno/google-vision`
- `/api/mathpix` → `/api/syno/mathpix`
- `/api/feedback` → `/api/syno/feedback`

## Option B: SYNO als eigenständige Route-Struktur

Wenn SYNO das Hauptprojekt ist und du andere Seiten hinzufügen willst:

### Schritt 1: Route-Struktur erstellen

```
app/
├── page.tsx                        # Hauptseite (z.B. Landing Page)
├── syno/
│   └── page.tsx                    # SYNO Taschenrechner
├── about/
│   └── page.tsx                    # Über-Seite
└── ...
```

### Schritt 2: Navigation hinzufügen

Erstelle eine Navigation-Komponente, die zwischen den Routen wechselt.

## Empfohlene Vorgehensweise

**Wenn du bereits ein Hauptprojekt hast:**
1. Kopiere den gesamten `app/` Ordner von SYNO nach `app/syno/` in dein Hauptprojekt
2. Passe die API-Pfade an
3. Füge einen Link auf der Hauptseite hinzu: `<Link href="/syno">SYNO</Link>`

**Wenn SYNO dein Hauptprojekt ist:**
1. Verschiebe `app/page.tsx` nach `app/syno/page.tsx`
2. Erstelle eine neue `app/page.tsx` als Landing Page
3. Füge Navigation hinzu

Soll ich dir bei einem der beiden Wege helfen? Welches Szenario trifft auf dich zu?

