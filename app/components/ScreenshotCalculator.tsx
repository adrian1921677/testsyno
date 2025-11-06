"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { createWorker } from "tesseract.js"
import { evaluate } from "mathjs"
import { X, Loader2, PenTool } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useSettingsStore } from "../lib/settings"
import { useTranslation } from "../lib/i18n"

interface ScreenshotCalculatorProps {
  onResult: (expression: string, result: number) => void
  onClose: () => void
}

type Point = [number, number]

export default function ScreenshotCalculator({ onResult, onClose }: ScreenshotCalculatorProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [points, setPoints] = useState<Point[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ocrText, setOcrText] = useState<string | null>(null)
  const [calculationResult, setCalculationResult] = useState<number | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fullFrameCanvasRef = useRef<HTMLCanvasElement | null>(null)
  
  const appTheme = useSettingsStore((state) => state.theme)
  const t = useTranslation()

  // Normalisiere mathematischen Ausdruck
  const normalizeExpr = useCallback((s: string): string => {
    return s
      .replace(/[–—−]/g, '-')  // verschiedene Minus-Zeichen
      .replace(/:/g, '/')      // Doppelpunkt → Division
      .replace(/[xX×]/g, '*')  // x, X, × → Multiplikation
      .replace(/,/g, '.')      // Komma → Punkt (Dezimal)
      .replace(/\s+/g, '')     // Leerzeichen entfernen
      .trim()
  }, [])

  // Extrahiere mathematischen Ausdruck aus OCR-Text
  const extractExpression = useCallback((text: string): string | null => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    
    // Filtere Zeilen, die mathematische Ausdrücke enthalten könnten
    const candidates = lines.filter(l => 
      /^[0-9\.\,\+\-\*\/\^\(\)=\s:×xX%]+$/.test(l) || 
      /^[0-9\.\,\+\-\*\/\^\(\)=\s:×xX%]+/.test(l)
    )
    
    if (candidates.length === 0) return null
    
    // Nimm die längste valide Zeile
    const best = candidates.sort((a, b) => b.length - a.length)[0]
    
    // Entferne "=" am Ende falls vorhanden
    const cleaned = best.replace(/=+$/, '').trim()
    
    return cleaned || null
  }, [])

  // OCR mit Tesseract.js
  const performOCR = useCallback(async (canvas: HTMLCanvasElement): Promise<string> => {
    const worker = await createWorker("eng+deu", 1)
    
    await worker.setParameters({
      tessedit_pageseg_mode: "8", // Einzelwort
      tessedit_char_whitelist: "0123456789+-*/()=.,%sincostanlogsqrtpi^√π×÷: ",
    })

    const { data: { text } } = await worker.recognize(canvas)
    await worker.terminate()
    
    return text
  }, [])

  // Berechne mathematischen Ausdruck
  const calculateExpression = useCallback((expr: string): number | null => {
    try {
      const normalized = normalizeExpr(expr)
      if (!normalized) return null
      
      const result = evaluate(normalized)
      return typeof result === 'number' && isFinite(result) ? result : null
    } catch (err) {
      console.error("Berechnungsfehler:", err)
      return null
    }
  }, [normalizeExpr])

  // Erstelle maskierten Canvas aus Polygon
  const createMaskedCanvas = useCallback((
    fullCanvas: HTMLCanvasElement,
    polygonPoints: Point[]
  ): HTMLCanvasElement | null => {
    const w = fullCanvas.width
    const h = fullCanvas.height
    
    // Skaliere Punkte von Screen-Koordinaten zu Canvas-Koordinaten
    const scaleX = w / window.innerWidth
    const scaleY = h / window.innerHeight
    const mappedPoints = polygonPoints.map(([x, y]) => [
      x * scaleX,
      y * scaleY
    ] as Point)
    
    // Berechne Bounding Box
    const xs = mappedPoints.map(p => p[0])
    const ys = mappedPoints.map(p => p[1])
    const minX = Math.max(0, Math.floor(Math.min(...xs)))
    const minY = Math.max(0, Math.floor(Math.min(...ys)))
    const maxX = Math.min(w, Math.ceil(Math.max(...xs)))
    const maxY = Math.min(h, Math.ceil(Math.max(...ys)))
    
    if (maxX - minX < 10 || maxY - minY < 10) {
      return null
    }
    
    // Erstelle Masken-Canvas
    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = maxX - minX
    maskCanvas.height = maxY - minY
    const maskCtx = maskCanvas.getContext('2d')
    
    if (!maskCtx) return null
    
    // Wende Polygon-Maske an
    maskCtx.save()
    maskCtx.beginPath()
    mappedPoints.forEach(([x, y], i) => {
      if (i === 0) {
        maskCtx.moveTo(x - minX, y - minY)
      } else {
        maskCtx.lineTo(x - minX, y - minY)
      }
    })
    maskCtx.closePath()
    maskCtx.clip()
    
    // Zeichne den ausgewählten Bereich
    maskCtx.drawImage(
      fullCanvas,
      minX, minY, maxX - minX, maxY - minY,
      0, 0, maxX - minX, maxY - minY
    )
    maskCtx.restore()
    
    return maskCanvas
  }, [])

  // Abbrechen
  const cancelCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.remove()
      videoRef.current = null
    }
    
    setPoints([])
    setIsDrawing(false)
    setIsCapturing(false)
    setIsProcessing(false)
    setError(null)
    setOcrText(null)
    setCalculationResult(null)
    fullFrameCanvasRef.current = null
  }, [])

  // Verarbeite erfasste Auswahl mit expliziten Punkten
  const handleCaptureWithPoints = useCallback(async (pointsToUse: Point[]) => {
    if (!fullFrameCanvasRef.current || pointsToUse.length < 10) {
      setError("Bitte zeichnen Sie einen Bereich aus")
      setPoints([])
      setIsDrawing(false)
      return
    }
    
    setIsDrawing(false)
    setIsProcessing(true)
    setError(null)
    
    try {
      // Erstelle maskierten Canvas
      const maskedCanvas = createMaskedCanvas(fullFrameCanvasRef.current, pointsToUse)
      
      if (!maskedCanvas) {
        throw new Error("Auswahl zu klein oder ungültig")
      }
      
      // OCR durchführen
      const ocrResult = await performOCR(maskedCanvas)
      setOcrText(ocrResult)
      
      // Extrahiere mathematischen Ausdruck
      const expression = extractExpression(ocrResult)
      
      if (!expression) {
        throw new Error("Kein mathematischer Ausdruck erkannt")
      }
      
      // Berechne Ergebnis
      const result = calculateExpression(expression)
      
      if (result === null) {
        throw new Error("Ausdruck konnte nicht berechnet werden")
      }
      
      setCalculationResult(result)
      
      // Ergebnis zurückgeben
      onResult(expression, result)
      
      // Cleanup
      cancelCapture()
      
    } catch (err: any) {
      console.error("Verarbeitungsfehler:", err)
      setError(err.message || "Fehler bei der Verarbeitung")
      setIsProcessing(false)
    }
  }, [createMaskedCanvas, performOCR, extractExpression, calculateExpression, onResult, cancelCapture])

  // Verarbeite erfasste Auswahl
  const handleCapture = useCallback(async () => {
    await handleCaptureWithPoints(points)
  }, [points, handleCaptureWithPoints])

  // Starte Screen Capture
  const startScreenCapture = useCallback(async () => {
    try {
      setIsCapturing(true)
      setError(null)
      setPoints([])
      
      // Screen Capture starten
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' } as any,
        audio: false,
      })
      
      streamRef.current = stream
      
      // Video-Element erstellen
      const video = document.createElement('video')
      video.srcObject = stream
      video.autoplay = true
      video.playsInline = true
      video.muted = true
      
      await video.play()
      
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve()
      })
      
      videoRef.current = video
      
      // Vollständigen Frame in Canvas zeichnen
      const fullCanvas = document.createElement('canvas')
      fullCanvas.width = video.videoWidth
      fullCanvas.height = video.videoHeight
      const ctx = fullCanvas.getContext('2d')
      
      if (!ctx) {
        throw new Error("Canvas-Kontext konnte nicht erstellt werden")
      }
      
      ctx.drawImage(video, 0, 0)
      fullFrameCanvasRef.current = fullCanvas
      
      // Stream stoppen (nur Frame benötigt)
      stream.getTracks().forEach(track => track.stop())
      video.remove()
      
      // Overlay für Lasso-Auswahl anzeigen
      setIsDrawing(true)
      
    } catch (err: any) {
      console.error("Screen Capture Fehler:", err)
      setError(err.message || "Screen Capture fehlgeschlagen")
      setIsCapturing(false)
      setIsDrawing(false)
    }
  }, [])

  // Zeichne Lasso-Overlay
  useEffect(() => {
    if (!isDrawing || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1
    
    // Canvas-Größe setzen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
    }
    resizeCanvas()
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.scale(dpr, dpr)
    
    let animationFrameId: number
    
    const draw = () => {
      // Canvas löschen
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
      
      // Halbtransparenter dunkler Hintergrund
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr)
      
      if (points.length > 1) {
        // Ausgewählter Bereich ausschneiden (heller)
        ctx.save()
        ctx.globalCompositeOperation = 'destination-out'
        ctx.beginPath()
        points.forEach(([x, y], i) => {
          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })
        ctx.closePath()
        ctx.fill()
        ctx.restore()
        
        // Kontur mit "marching ants" Effekt
        ctx.strokeStyle = '#fff'
        ctx.setLineDash([6, 4])
        ctx.lineWidth = 2
        ctx.beginPath()
        points.forEach(([x, y], i) => {
          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })
        ctx.closePath()
        ctx.stroke()
      }
      
      animationFrameId = requestAnimationFrame(draw)
    }
    
    draw()
    
    // Resize-Handler
    window.addEventListener('resize', resizeCanvas)
    
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [isDrawing, points])

  // ESC-Taste Handler
  useEffect(() => {
    if (!isDrawing) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        cancelCapture()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDrawing, cancelCapture])

  // Cleanup bei Unmount oder Schließen
  useEffect(() => {
    return () => {
      cancelCapture()
    }
  }, [cancelCapture])

  // Beim Schließen Zustand zurücksetzen
  const handleClose = useCallback(() => {
    cancelCapture()
    onClose()
  }, [cancelCapture, onClose])

  return (
    <AnimatePresence>
      {!isCapturing && !isDrawing && !isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-md mx-4 rounded-lg overflow-hidden ${
              appTheme === "light" ? "bg-white" : "bg-zinc-900"
            }`}
          >
            <div className={`p-6 border-b ${
              appTheme === "light" ? "border-gray-200" : "border-zinc-800"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-semibold ${
                  appTheme === "light" ? "text-gray-900" : "text-white"
                }`}>
                  Screenshot rechnen
                </h2>
                <button
                  onClick={handleClose}
                  className={`p-2 rounded-md transition ${
                    appTheme === "light"
                      ? "hover:bg-gray-100 text-gray-600"
                      : "hover:bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className={`text-sm ${
                appTheme === "light" ? "text-gray-600" : "text-zinc-400"
              }`}>
                Zeichnen Sie einen Bereich auf dem Bildschirm, um einen mathematischen Ausdruck zu erkennen und zu berechnen.
              </p>
            </div>
            
            <div className={`p-6 ${
              appTheme === "light" ? "bg-gray-50" : "bg-zinc-900"
            }`}>
              <button
                onClick={startScreenCapture}
                disabled={isProcessing}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
                  isProcessing
                    ? "bg-gray-400 cursor-not-allowed"
                    : appTheme === "light"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                <PenTool size={20} />
                Screenshot starten
              </button>
              
              <p className={`text-xs mt-4 text-center ${
                appTheme === "light" ? "text-gray-500" : "text-zinc-500"
              }`}>
                Tipp: Doppelklick schließt die Auswahl • ESC zum Abbrechen
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {(isDrawing || isCapturing) && (
        <div
          ref={overlayRef}
          className="fixed inset-0 cursor-crosshair"
          style={{ 
            pointerEvents: 'auto', 
            touchAction: 'none',
            zIndex: 999999
          }}
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (e.button !== 0) return
            const canvas = canvasRef.current
            if (!canvas) return
            const rect = canvas.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            setPoints([[x, y]])
            console.log('Pointer down:', x, y)
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1 && points.length > 0) {
              e.preventDefault()
              e.stopPropagation()
              const canvas = canvasRef.current
              if (!canvas) return
              const rect = canvas.getBoundingClientRect()
              const x = e.clientX - rect.left
              const y = e.clientY - rect.top
              setPoints(prev => [...prev, [x, y]])
            }
          }}
          onPointerUp={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Pointer up, points:', points.length)
            if (points.length > 10) {
              handleCaptureWithPoints(points)
            } else {
              setPoints([])
            }
          }}
          onDoubleClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (points.length > 10) {
              handleCaptureWithPoints(points)
            }
          }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none', cursor: 'crosshair' }}
          />
          
          {/* Anweisungen */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm pointer-events-none" style={{ zIndex: 1000000 }}>
            {points.length === 0 
              ? "Zeichnen Sie einen Bereich aus (Doppelklick zum Schließen)"
              : `${points.length} Punkte • Doppelklick zum Schließen • ESC zum Abbrechen`
            }
          </div>
        </div>
      )}
      
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80"
        >
          <div className={`rounded-lg p-6 ${
            appTheme === "light" ? "bg-white" : "bg-zinc-900"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span className={`text-lg font-medium ${
                appTheme === "light" ? "text-gray-900" : "text-white"
              }`}>
                Verarbeite...
              </span>
            </div>
            
            {ocrText && (
              <div className={`mb-2 p-2 rounded text-sm ${
                appTheme === "light" ? "bg-gray-100 text-gray-800" : "bg-zinc-800 text-zinc-300"
              }`}>
                <strong>Erkannt:</strong> {ocrText}
              </div>
            )}
            
            {calculationResult !== null && (
              <div className={`p-2 rounded text-sm ${
                appTheme === "light" ? "bg-green-100 text-green-800" : "bg-green-900/30 text-green-400"
              }`}>
                <strong>Ergebnis:</strong> {calculationResult}
              </div>
            )}
            
            {error && (
              <div className={`mt-2 p-2 rounded text-sm ${
                appTheme === "light" ? "bg-red-100 text-red-800" : "bg-red-900/30 text-red-400"
              }`}>
                {error}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

