# Syno - Intelligenter Taschenrechner

Ein moderner, web-basierter Taschenrechner mit natürlicher Spracheingabe, OCR-Funktionalität und mehreren Berechnungsmodi.

## Überblick

Syno ist ein intelligenter Taschenrechner, der mathematische Ausdrücke in natürlicher Sprache versteht und verschiedene Berechnungsmodi unterstützt. Die Anwendung ermöglicht es, mathematische Aufgaben per Kamera zu fotografieren oder hochzuladen und automatisch zu erkennen.

## Features

- **Vier Berechnungsmodi**: Basic, Developer, Finance, Advanced
- **Natürliche Spracheingabe**: Unterstützt deutsche Phrasen wie "15% von 249" oder "2 hoch 5"
- **OCR-Funktionalität**: Mathematische Aufgaben per Kamera fotografieren oder als Bild hochladen
- **Rechenweg-Export**: Vollständige Berechnungsschritte kopieren
- **Verlauf**: Berechnungen werden lokal gespeichert
- **Responsive Design**: Optimiert für Desktop und Mobile
- **Dark/Light Mode**: Anpassbares Farbschema
- **Mehrsprachig**: Unterstützung für Deutsch und Englisch
- **Feedback-System**: Direktes Feedback an die Entwickler

## Technologie-Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **State Management**: Zustand
- **Berechnungen**: MathJS
- **OCR**: Tesseract.js, Google Cloud Vision API, MathPix API
- **E-Mail**: Resend

## Installation

### Voraussetzungen

- Node.js 18+ und npm

### Setup

1. Repository klonen:
```bash
git clone <repository-url>
cd SYNO
```

2. Dependencies installieren:
```bash
npm install
```

3. Umgebungsvariablen konfigurieren:

Erstelle eine `.env.local` Datei im Root-Verzeichnis:

```env
# Google Cloud Vision API (empfohlen, kostenlos bis 1000 Requests/Monat)
GOOGLE_VISION_API_KEY=your_api_key_here

# MathPix API (optional, für optimale Mathematik-OCR)
MATHPIX_APP_ID=your_app_id_here
MATHPIX_APP_KEY=your_app_key_here

# Resend API (für Feedback-System)
RESEND_API_KEY=re_...
FEEDBACK_TO=your-email@domain.com
```

### API-Keys einrichten

#### Google Cloud Vision API (empfohlen)

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com)
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Aktiviere die Cloud Vision API
4. Erstelle einen API Key unter "APIs & Services" → "Credentials"
5. Füge den Key zu `.env.local` hinzu

**Hinweis**: Google Cloud Vision bietet 1000 kostenlose Requests pro Monat.

#### MathPix API (optional)

1. Registriere dich auf [mathpix.com](https://mathpix.com)
2. Erstelle eine neue App im Dashboard
3. Kopiere App ID und App Key
4. Füge beide Werte zu `.env.local` hinzu

**Hinweis**: Ohne API-Keys verwendet die App Tesseract.js als Fallback (vollständig kostenlos, aber weniger genau).

#### Resend API (optional)

1. Registriere dich auf [resend.com](https://resend.com)
2. Hole deinen API-Key aus dem Dashboard
3. Verifiziere deine Domain für Production-Nutzung
4. Füge den Key und die Empfänger-E-Mail zu `.env.local` hinzu

**Hinweis**: Ohne Resend-Key läuft das Feedback-System im Entwicklungsmodus (Ausgabe in der Konsole).

## Entwicklung

Starte den Development-Server:

```bash
npm run dev
```

Die Anwendung ist dann unter [http://localhost:3000](http://localhost:3000) erreichbar.

## Build für Production

```bash
npm run build
npm start
```

## Verwendung

### Berechnungen eingeben

- Gib mathematische Ausdrücke direkt ein (z.B. `2 + 2`, `15% von 249`)
- Verwende natürliche Sprache für komplexere Berechnungen
- Nutze die Symbol-Toolbar für häufige Operatoren

### OCR verwenden

1. Klicke auf das Upload-Icon im Eingabefeld
2. Wähle zwischen Kamera, Datei-Upload oder Screenshot
3. Die App erkennt automatisch mathematische Ausdrücke im Bild
4. Der erkannte Text wird in das Eingabefeld übernommen

### Berechnungsmodi

- **Basic**: Standard-Berechnungen
- **Developer**: Hexadezimal, Binär, Bit-Operationen
- **Finance**: Prozentrechnung, Zinsen, Finanzformeln
- **Advanced**: Trigonometrie, Logarithmen, komplexe Funktionen

## Lizenz

Private / Internal Project
