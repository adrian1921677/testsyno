# Syno - Intelligenter Taschenrechner

Ein moderner, natürlicher Taschenrechner mit mehreren Modi und Feedback-System.

## Features

- **4 Modi**: Basic, Developer, Finance, Advanced
- **Natürliche Sprache**: Unterstützt deutsche Phrasen ("15% von 249", "2 hoch 5")
- **Verlauf & Favoriten**: Speichert Berechnungen im LocalStorage
- **Themen-basierte UI**: Dynamische Farben & Animationen pro Mode
- **Feedback-System**: Stern-Icon unten links

## Setup

### Dependencies installieren

```bash
npm install
```

### Environment Variables

Erstelle `.env.local`:

```env
RESEND_API_KEY=re_...
FEEDBACK_TO=deine.email@domain.com
```

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
- Resend (E-Mail)

## Feedback-System

Ohne `RESEND_API_KEY` läuft das Feedback-System im Dev-Modus (console.log).
Mit API-Key werden E-Mails via Resend versendet.

## Lizenz

Private / Internal Project
