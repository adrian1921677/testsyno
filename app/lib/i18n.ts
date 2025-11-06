import { useSettingsStore } from "./settings"

export type TranslationKey = 
  | "settings.title"
  | "settings.description"
  | "settings.language"
  | "settings.theme"
  | "settings.light"
  | "settings.dark"
  | "settings.german"
  | "settings.english"
  | "input.placeholder"
  | "input.autoCorrected"
  | "input.modeDetected"
  | "input.error.title"
  | "input.error.suggestion"
  | "result.confirmed"
  | "result.lastValid"
  | "result.try"
  | "result.copy"
  | "result.copied"
  | "result.copySteps"
  | "result.stepsCopied"
  | "shortcuts.title"
  | "shortcuts.calculate"
  | "shortcuts.history"
  | "shortcuts.delete"
  | "shortcuts.clear"
  | "sidebar.history"
  | "sidebar.favorites"
  | "sidebar.noEntries"
  | "sidebar.removeFavorite"
  | "sidebar.addFavorite"
  | "sidebar.delete"
  | "feedback.title"
  | "feedback.message"
  | "feedback.messagePlaceholder"
  | "feedback.email"
  | "feedback.emailPlaceholder"
  | "feedback.submit"
  | "feedback.sending"
  | "feedback.success"
  | "feedback.error"
  | "camera.title"
  | "camera.instruction"
  | "camera.capture"
  | "camera.processing"
  | "camera.tips"
  | "camera.upload"
  | "camera.uploadInstruction"
  | "camera.selectFile"
  | "camera.modeCamera"
  | "camera.modeUpload"
  | "camera.modeScreenshot"
  | "camera.screenshotDescription"
  | "camera.screenshotStart"
  | "camera.screenshotSelecting"
  | "camera.screenshotInstruction"
  | "camera.toolRectangle"
  | "camera.toolFreehand"
  | "camera.toolUndo"
  | "camera.screenshotDrawInstruction"

const translations: Record<"de" | "en", Record<TranslationKey, string>> = {
  de: {
    "settings.title": "Einstellungen",
    "settings.description": "Passe die Sprache und das Theme an",
    "settings.language": "Sprache",
    "settings.theme": "Theme",
    "settings.light": "Light",
    "settings.dark": "Dark",
    "settings.german": "Deutsch",
    "settings.english": "English",
    "input.placeholder": "Eingabe: 20% von 12, 2 + 10, sin(30°), npv(0.08, -1000, 400), 0xFF...",
    "input.autoCorrected": "Automatisch korrigiert in:",
    "input.modeDetected": "Automatisch erkannt:",
    "input.error.title": "Syntaxfehler – das sieht nicht nach einer gültigen Formel aus. Versuch z. B.:",
    "input.error.suggestion": "50 geteilt durch 7",
    "result.confirmed": "Bestätigt:",
    "result.lastValid": "Letztes gültiges Ergebnis:",
    "result.try": "Versuch:",
    "result.copy": "Ergebnis kopieren",
    "result.copied": "Kopiert!",
    "result.copySteps": "Rechenweg kopieren",
    "result.stepsCopied": "Rechenweg kopiert!",
    "shortcuts.title": "Tastenkürzel:",
    "shortcuts.calculate": "Enter = berechnen",
    "shortcuts.history": "↑ = Verlauf",
    "shortcuts.delete": "↓ = löschen",
    "shortcuts.clear": "Esc = Eingabe löschen",
    "sidebar.history": "Verlauf",
    "sidebar.favorites": "Favoriten",
    "sidebar.noEntries": "Keine Einträge",
    "sidebar.removeFavorite": "Favorit entfernen",
    "sidebar.addFavorite": "Als Favorit speichern",
    "sidebar.delete": "Löschen",
    "feedback.title": "Feedback",
    "feedback.message": "Dein Feedback (optional)",
    "feedback.messagePlaceholder": "Was ist gut? Was fehlt? Bugs?",
    "feedback.email": "E-Mail (optional, für Rückfragen)",
    "feedback.emailPlaceholder": "deine@email.de",
    "feedback.submit": "Absenden",
    "feedback.sending": "Senden...",
    "feedback.success": "Danke! Feedback gesendet.",
    "feedback.error": "Senden fehlgeschlagen.",
    "camera.title": "Aufgabe fotografieren",
    "camera.instruction": "Richten Sie die Kamera auf die mathematische Aufgabe",
    "camera.capture": "Aufgabe erkennen",
    "camera.processing": "Wird verarbeitet...",
    "camera.tips": "Tipp: Gute Beleuchtung und klare Schrift verbessern die Erkennung",
    "camera.upload": "Bild hochladen",
    "camera.uploadInstruction": "Wählen Sie ein Bild mit einer mathematischen Aufgabe aus",
    "camera.selectFile": "Datei auswählen",
    "camera.modeCamera": "Kamera",
    "camera.modeUpload": "Hochladen",
    "camera.modeScreenshot": "Screenshot",
    "camera.screenshotDescription": "Erfassen Sie einen Bildschirmbereich mit einer mathematischen Aufgabe",
    "camera.screenshotStart": "Screenshot starten",
    "camera.screenshotSelecting": "Bereich auswählen...",
    "camera.screenshotInstruction": "Ziehen Sie einen Bereich auf, um ihn zu erfassen",
    "camera.toolRectangle": "Rechteck",
    "camera.toolFreehand": "Freihandform",
    "camera.toolUndo": "Rückgängig (Strg+Z)",
    "camera.screenshotDrawInstruction": "Zeichnen Sie einen Bereich frei mit der Maus",
  },
  en: {
    "settings.title": "Settings",
    "settings.description": "Adjust language and theme",
    "settings.language": "Language",
    "settings.theme": "Theme",
    "settings.light": "Light",
    "settings.dark": "Dark",
    "settings.german": "German",
    "settings.english": "English",
    "input.placeholder": "Input: 20% of 12, 2 + 10, sin(30°), npv(0.08, -1000, 400), 0xFF...",
    "input.autoCorrected": "Auto-corrected to:",
    "input.modeDetected": "Auto-detected:",
    "input.error.title": "Syntax error – this doesn't look like a valid formula. Try e.g.:",
    "input.error.suggestion": "50 divided by 7",
    "result.confirmed": "Confirmed:",
    "result.lastValid": "Last valid result:",
    "result.try": "Try:",
    "result.copy": "Copy result",
    "result.copied": "Copied!",
    "result.copySteps": "Copy calculation steps",
    "result.stepsCopied": "Calculation steps copied!",
    "shortcuts.title": "Shortcuts:",
    "shortcuts.calculate": "Enter = calculate",
    "shortcuts.history": "↑ = history",
    "shortcuts.delete": "↓ = delete",
    "shortcuts.clear": "Esc = clear input",
    "sidebar.history": "History",
    "sidebar.favorites": "Favorites",
    "sidebar.noEntries": "No entries",
    "sidebar.removeFavorite": "Remove favorite",
    "sidebar.addFavorite": "Add to favorites",
    "sidebar.delete": "Delete",
    "feedback.title": "Feedback",
    "feedback.message": "Your feedback (optional)",
    "feedback.messagePlaceholder": "What's good? What's missing? Bugs?",
    "feedback.email": "Email (optional, for follow-up)",
    "feedback.emailPlaceholder": "your@email.com",
    "feedback.submit": "Submit",
    "feedback.sending": "Sending...",
    "feedback.success": "Thanks! Feedback sent.",
    "feedback.error": "Sending failed.",
    "camera.title": "Capture Math Problem",
    "camera.instruction": "Point camera at the math problem",
    "camera.capture": "Recognize Problem",
    "camera.processing": "Processing...",
    "camera.tips": "Tip: Good lighting and clear handwriting improve recognition",
    "camera.upload": "Upload Image",
    "camera.uploadInstruction": "Select an image with a math problem",
    "camera.selectFile": "Select File",
    "camera.modeCamera": "Camera",
    "camera.modeUpload": "Upload",
    "camera.modeScreenshot": "Screenshot",
    "camera.screenshotDescription": "Capture a screen area with a math problem",
    "camera.screenshotStart": "Start Screenshot",
    "camera.screenshotSelecting": "Selecting area...",
    "camera.screenshotInstruction": "Drag to select an area to capture",
    "camera.toolRectangle": "Rectangle",
    "camera.toolFreehand": "Freehand",
    "camera.toolUndo": "Undo (Ctrl+Z)",
    "camera.screenshotDrawInstruction": "Draw a freehand area with your mouse",
  },
}

export function useTranslation() {
  const language = useSettingsStore((state) => state.language)
  
  return (key: TranslationKey): string => {
    return translations[language][key] || key
  }
}

