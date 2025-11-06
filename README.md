# Syno - Intelligenter Taschenrechner

Ein moderner, natürlicher Taschenrechner mit mehreren Modi und Feedback-System.

## Features

- **4 Modi**: Basic, Developer, Finance, Advanced
- **Natürliche Sprache**: Unterstützt deutsche Phrasen ("15% von 249", "2 hoch 5")
- **Kamera-OCR**: Fotografiere mathematische Aufgaben (MathPix oder Tesseract)
- **Rechenweg-Kopieren**: Kopiere den vollständigen Rechenweg für Hausaufgaben
- **Verlauf & Favoriten**: Speichert Berechnungen im LocalStorage
- **Themen-basierte UI**: Dynamische Farben & Animationen pro Mode
- **Dark/Light Mode**: Vollständige Theme-Unterstützung
- **Mehrsprachig**: Deutsch und Englisch
- **Feedback-System**: Stern-Icon unten links

## Setup

### Dependencies installieren

```bash
npm install
```

### Environment Variables

Erstelle `.env.local` (kopiere von `.env.example`):

```env
# Google Cloud Vision API (kostenlos bis 1000 Requests/Monat - EMPFOHLEN)
GOOGLE_VISION_API_KEY=your_api_key_here

# MathPix API (optional, für noch bessere Mathematik-OCR)
MATHPIX_APP_ID=your_app_id_here
MATHPIX_APP_KEY=your_app_key_here

# Resend API (für Feedback-System)
RESEND_API_KEY=re_...
FEEDBACK_TO=deine.email@domain.com
```

### Google Cloud Vision Setup (kostenlos, empfohlen)

Google Cloud Vision bietet **1000 kostenlose Requests pro Monat**:

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com)
2. Erstelle ein neues Projekt (oder verwende ein bestehendes)
3. Aktiviere die **Cloud Vision API**
4. Erstelle einen **API Key**:
   - Gehe zu "APIs & Services" → "Credentials"
   - Klicke auf "Create Credentials" → "API Key"
   - Kopiere den API-Key
5. Füge `GOOGLE_VISION_API_KEY=dein_api_key` zu `.env.local` hinzu

**Vorteile**: 
- ✅ Kostenlos bis 1000 Requests/Monat
- ✅ Sehr gute Texterkennung
- ✅ Funktioniert gut mit mathematischen Ausdrücken
- ✅ Automatischer Fallback zu Tesseract.js

### MathPix Setup (optional)

MathPix bietet die beste Erkennung für mathematische Formeln:

1. Registriere dich kostenlos auf [mathpix.com](https://mathpix.com)
2. Erstelle eine neue App im Dashboard
3. Kopiere `App ID` und `App Key`
4. Füge sie zu `.env.local` hinzu

**Ohne API-Keys**: Die App verwendet Tesseract.js (vollständig kostenlos, aber weniger genau)

### Resend Setup

1. Registriere dich auf [resend.com](https://resend.com)
2. Hole deinen API-Key aus dem Dashboard
3. Domain verifizieren (für Production)

### Development

```bash
npm run dev
```

Die App läuft auf [http://localhost:3000](http://localhost:3000)

## Technologie-Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Zustand (State Management)
- MathJS (Berechnungen)
- Tesseract.js (OCR - Fallback, kostenlos)
- Google Cloud Vision API (OCR - kostenlos bis 1000/Monat, empfohlen)
- MathPix API (OCR - optional, beste Qualität)
- Resend (E-Mail)

## Feedback-System

Ohne `RESEND_API_KEY` läuft das Feedback-System im Dev-Modus (console.log).
Mit API-Key werden E-Mails via Resend versendet.

## Lizenz

Private / Internal Project
