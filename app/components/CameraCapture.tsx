"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { Camera, X, Loader2, Upload, Monitor, Square, PenTool, Undo2 } from "lucide-react"
import { createWorker } from "tesseract.js"
import { motion, AnimatePresence } from "framer-motion"
import { useSettingsStore } from "../lib/settings"
import { useTranslation } from "../lib/i18n"
import { normalizeInput } from "../lib/miniNlp"

interface CameraCaptureProps {
  onTextRecognized: (text: string) => void
  onClose: () => void
  onReopen?: () => void // Callback um Dialog wieder zu öffnen
}

export default function CameraCapture({ onTextRecognized, onClose, onReopen }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ocrMethod, setOcrMethod] = useState<"mathpix" | "google" | "tesseract">("google") // Google Vision als Standard
  const [mode, setMode] = useState<"camera" | "upload" | "screenshot">("camera") // Kamera, Upload oder Screenshot-Modus
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [screenshotMode, setScreenshotMode] = useState<"selecting" | "captured" | "idle">("idle")
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [screenshotTool, setScreenshotTool] = useState<"rectangle" | "freehand">("freehand") // Standard: Freihandform
  const [freehandPath, setFreehandPath] = useState<Array<{ x: number; y: number }>>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const screenshotCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const screenshotOverlayRef = useRef<HTMLDivElement>(null)
  const appTheme = useSettingsStore((state) => state.theme)
  const t = useTranslation()

  useEffect(() => {
    if (mode === "camera") {
      startCamera()
      // Prüfe welche OCR-Methode verfügbar ist
      checkAvailableOCRMethods()
    } else if (mode === "screenshot" && screenshotMode === "idle") {
      // Bereite Screenshot-Modus vor
      setScreenshotMode("idle")
    }
    return () => {
      if (mode === "camera") {
        stopCamera()
      }
      if (mode === "screenshot") {
        setScreenshotMode("idle")
        setSelectionRect(null)
      }
    }
  }, [mode])

  // Screenshot-Bereichsauswahl Event Handler mit Freihandform
  useEffect(() => {
    if (screenshotMode === "selecting") {
      let currentStartPos: { x: number; y: number } | null = null
      let currentIsSelecting = false
      let currentSelectionRect: { x: number; y: number; width: number; height: number } | null = null
      let currentFreehandPath: Array<{ x: number; y: number }> = []
      let selectionDiv: HTMLDivElement | null = null
      let instructionDiv: HTMLDivElement | null = null
      let toolBarDiv: HTMLDivElement | null = null
      let drawingCanvas: HTMLCanvasElement | null = null

      // Erstelle Overlay-Elemente
      const overlay = document.getElementById("screenshot-overlay")
      if (overlay) {
        // Erstelle Toolbar
        toolBarDiv = document.createElement("div")
        toolBarDiv.className = "absolute top-4 left-4 flex gap-2 bg-black/80 rounded-lg p-2 z-[10000]"
        overlay.appendChild(toolBarDiv)

        // Rechteck-Button
        const rectBtn = document.createElement("button")
        rectBtn.className = `px-3 py-2 rounded text-sm font-medium transition ${
          screenshotTool === "rectangle"
            ? "bg-blue-600 text-white"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        }`
        rectBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`
        rectBtn.title = t("camera.toolRectangle")
        rectBtn.onclick = () => {
          setScreenshotTool("rectangle")
          setFreehandPath([])
          if (drawingCanvas) {
            const ctx = drawingCanvas.getContext("2d")
            if (ctx) ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height)
          }
        }
        toolBarDiv.appendChild(rectBtn)

        // Freihandform-Button
        const freehandBtn = document.createElement("button")
        freehandBtn.className = `px-3 py-2 rounded text-sm font-medium transition ${
          screenshotTool === "freehand"
            ? "bg-blue-600 text-white"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        }`
        freehandBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2s3.09 1.46 3.09 4.54c0 2.08-1.66 3.77-3.09 3.77s-3.09-1.69-3.09-3.77C8.91 3.46 12 2 12 2z"/><path d="M12 12c-2.5 0-4.5-2-4.5-4.5S9.5 3 12 3s4.5 2 4.5 4.5S14.5 12 12 12z"/></svg>`
        freehandBtn.title = t("camera.toolFreehand")
        freehandBtn.onclick = () => {
          setScreenshotTool("freehand")
          setSelectionRect(null)
        }
        toolBarDiv.appendChild(freehandBtn)

        // Undo-Button
        const undoBtn = document.createElement("button")
        undoBtn.className = "px-3 py-2 rounded text-sm font-medium transition bg-gray-700 text-gray-300 hover:bg-gray-600"
        undoBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>`
        undoBtn.title = t("camera.toolUndo")
        undoBtn.onclick = () => {
          if (screenshotTool === "freehand") {
            setFreehandPath([])
            if (drawingCanvas) {
              const ctx = drawingCanvas.getContext("2d")
              if (ctx) ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height)
            }
          } else {
            setSelectionRect(null)
          }
        }
        toolBarDiv.appendChild(undoBtn)

        // Erstelle Drawing Canvas für Freihandform
        drawingCanvas = document.createElement("canvas")
        drawingCanvas.width = window.innerWidth
        drawingCanvas.height = window.innerHeight
        drawingCanvas.style.position = "absolute"
        drawingCanvas.style.top = "0"
        drawingCanvas.style.left = "0"
        drawingCanvas.style.pointerEvents = "none"
        drawingCanvas.style.zIndex = "9998"
        overlay.appendChild(drawingCanvas)
        drawingCanvasRef.current = drawingCanvas

        // Erstelle Selection Rectangle (für Rechteck-Modus)
        selectionDiv = document.createElement("div")
        selectionDiv.className = "absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
        selectionDiv.style.display = "none"
        selectionDiv.style.zIndex = "9998"
        overlay.appendChild(selectionDiv)

        // Erstelle Instruction Text
        instructionDiv = document.createElement("div")
        instructionDiv.className = "absolute top-20 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm pointer-events-none z-[10000]"
        instructionDiv.textContent = screenshotTool === "freehand" 
          ? t("camera.screenshotDrawInstruction")
          : t("camera.screenshotInstruction")
        overlay.appendChild(instructionDiv)
      }

      const handleMouseDown = (e: MouseEvent) => {
        e.preventDefault()
        if (screenshotTool === "rectangle") {
          currentIsSelecting = true
          currentStartPos = { x: e.clientX, y: e.clientY }
          currentSelectionRect = { x: e.clientX, y: e.clientY, width: 0, height: 0 }
          setIsSelecting(true)
          setStartPos(currentStartPos)
          setSelectionRect(currentSelectionRect)
          
          if (selectionDiv) {
            selectionDiv.style.display = "block"
            selectionDiv.style.left = `${e.clientX}px`
            selectionDiv.style.top = `${e.clientY}px`
            selectionDiv.style.width = "0px"
            selectionDiv.style.height = "0px"
          }
        } else {
          // Freihandform
          setIsDrawing(true)
          currentFreehandPath = [{ x: e.clientX, y: e.clientY }]
          setFreehandPath(currentFreehandPath)
          
          if (drawingCanvas) {
            const ctx = drawingCanvas.getContext("2d")
            if (ctx) {
              ctx.strokeStyle = "#3b82f6"
              ctx.lineWidth = 3
              ctx.lineCap = "round"
              ctx.lineJoin = "round"
              ctx.beginPath()
              ctx.moveTo(e.clientX, e.clientY)
            }
          }
        }
      }

      const handleMouseMove = (e: MouseEvent) => {
        if (screenshotTool === "rectangle" && currentIsSelecting && currentStartPos && selectionDiv) {
          const x = Math.min(currentStartPos.x, e.clientX)
          const y = Math.min(currentStartPos.y, e.clientY)
          const width = Math.abs(e.clientX - currentStartPos.x)
          const height = Math.abs(e.clientY - currentStartPos.y)
          currentSelectionRect = { x, y, width, height }
          setSelectionRect(currentSelectionRect)
          
          selectionDiv.style.left = `${x}px`
          selectionDiv.style.top = `${y}px`
          selectionDiv.style.width = `${width}px`
          selectionDiv.style.height = `${height}px`
        } else if (screenshotTool === "freehand" && isDrawing && drawingCanvas) {
          const ctx = drawingCanvas.getContext("2d")
          if (ctx) {
            ctx.lineTo(e.clientX, e.clientY)
            ctx.stroke()
            currentFreehandPath.push({ x: e.clientX, y: e.clientY })
            setFreehandPath([...currentFreehandPath])
          }
        }
      }

      const handleMouseUp = async () => {
        setIsDrawing(false)
        
        if (screenshotTool === "rectangle" && currentIsSelecting && currentSelectionRect && currentSelectionRect.width > 10 && currentSelectionRect.height > 10) {
          await captureRectangleSelection(currentSelectionRect)
        } else if (screenshotTool === "freehand" && currentFreehandPath.length > 10) {
          await captureFreehandSelection(currentFreehandPath)
        } else {
          setIsSelecting(false)
          setStartPos(null)
          if (selectionDiv) {
            selectionDiv.style.display = "none"
          }
        }
      }

      // ESC-Taste zum Abbrechen
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          const overlay = document.getElementById("screenshot-overlay")
          if (overlay) {
            overlay.remove()
          }
          setScreenshotMode("idle")
          setSelectionRect(null)
          setFreehandPath([])
          setIsSelecting(false)
          setIsDrawing(false)
          setStartPos(null)
        } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
          e.preventDefault()
          if (screenshotTool === "freehand") {
            setFreehandPath([])
            if (drawingCanvas) {
              const ctx = drawingCanvas.getContext("2d")
              if (ctx) ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height)
            }
          } else {
            setSelectionRect(null)
          }
        }
      }

      // Update instruction text when tool changes
      const updateInstruction = () => {
        if (instructionDiv) {
          instructionDiv.textContent = screenshotTool === "freehand" 
            ? t("camera.screenshotDrawInstruction")
            : t("camera.screenshotInstruction")
        }
      }
      
      // Update button states when tool changes
      const updateToolButtons = () => {
        if (toolBarDiv) {
          const rectBtn = toolBarDiv.querySelector("button:first-child")
          const freehandBtn = toolBarDiv.querySelector("button:nth-child(2)")
          
          if (rectBtn) {
            rectBtn.className = `px-3 py-2 rounded text-sm font-medium transition ${
              screenshotTool === "rectangle"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`
          }
          
          if (freehandBtn) {
            freehandBtn.className = `px-3 py-2 rounded text-sm font-medium transition ${
              screenshotTool === "freehand"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`
          }
        }
      }
      
      updateInstruction()
      updateToolButtons()
      
      // Watch for tool changes
      const toolChangeInterval = setInterval(() => {
        updateInstruction()
        updateToolButtons()
      }, 100)

      window.addEventListener("mousedown", handleMouseDown)
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      window.addEventListener("keydown", handleKeyDown)

      return () => {
        window.removeEventListener("mousedown", handleMouseDown)
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
        window.removeEventListener("keydown", handleKeyDown)
        
        // Cleanup Interval
        if (toolChangeInterval) {
          clearInterval(toolChangeInterval)
        }
        
        // Cleanup Overlay
        const overlay = document.getElementById("screenshot-overlay")
        if (overlay) {
          overlay.remove()
        }
      }
    }
  }, [screenshotMode, screenshotTool, isDrawing, ocrMethod, t])

  // Hilfsfunktion: Rechteck-Auswahl erfassen
  async function captureRectangleSelection(rect: { x: number; y: number; width: number; height: number }) {
    setIsSelecting(false)
    setStartPos(null)
    
    // Entferne Overlay
    const overlay = document.getElementById("screenshot-overlay")
    if (overlay) {
      overlay.remove()
    }
    
    if (!screenshotCanvasRef.current) {
      setScreenshotMode("idle")
      return
    }

    setIsProcessing(true)
    setError(null)
    setScreenshotMode("captured")

    try {
      const sourceCanvas = screenshotCanvasRef.current
      const { x, y, width, height } = rect

      // Skaliere Koordinaten relativ zum Canvas
      const scaleX = sourceCanvas.width / window.innerWidth
      const scaleY = sourceCanvas.height / window.innerHeight
      const scaledX = x * scaleX
      const scaledY = y * scaleY
      const scaledWidth = width * scaleX
      const scaledHeight = height * scaleY

      // Erstelle Canvas für den ausgewählten Bereich
      if (!canvasRef.current) return
      const canvas = canvasRef.current
      canvas.width = scaledWidth
      canvas.height = scaledHeight

      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (ctx) {
        ctx.drawImage(
          sourceCanvas,
          scaledX, scaledY, scaledWidth, scaledHeight,
          0, 0, scaledWidth, scaledHeight
        )

        setPreviewImage(canvas.toDataURL())

        if (ocrMethod === "tesseract") {
          preprocessImage(canvas)
        }
      }

      setScreenshotMode("idle")
      setSelectionRect(null)

      if (onReopen) {
        onReopen()
      }

      await processImage(canvas)
    } catch (err) {
      console.error("Screenshot-OCR-Fehler:", err)
      setError("Fehler bei der Screenshot-Verarbeitung.")
      setIsProcessing(false)
      setScreenshotMode("idle")
      setSelectionRect(null)
    }
  }

  // Hilfsfunktion: Freihandform-Auswahl erfassen
  async function captureFreehandSelection(path: Array<{ x: number; y: number }>) {
    setIsDrawing(false)
    
    // Entferne Overlay
    const overlay = document.getElementById("screenshot-overlay")
    if (overlay) {
      overlay.remove()
    }
    
    if (!screenshotCanvasRef.current || path.length === 0) {
      setScreenshotMode("idle")
      setFreehandPath([])
      return
    }

    setIsProcessing(true)
    setError(null)
    setScreenshotMode("captured")

    try {
      const sourceCanvas = screenshotCanvasRef.current
      
      // Skaliere Pfad-Koordinaten relativ zum Canvas
      const scaleX = sourceCanvas.width / window.innerWidth
      const scaleY = sourceCanvas.height / window.innerHeight
      const scaledPath = path.map(p => ({
        x: p.x * scaleX,
        y: p.y * scaleY
      }))

      // Berechne Bounding Box des Pfads
      const minX = Math.min(...scaledPath.map(p => p.x))
      const maxX = Math.max(...scaledPath.map(p => p.x))
      const minY = Math.min(...scaledPath.map(p => p.y))
      const maxY = Math.max(...scaledPath.map(p => p.y))
      const width = maxX - minX
      const height = maxY - minY

      if (width < 10 || height < 10) {
        throw new Error("Auswahl zu klein")
      }

      // Erstelle Canvas für den ausgewählten Bereich
      if (!canvasRef.current) return
      const canvas = canvasRef.current
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (ctx) {
        // Erstelle Maske aus dem Pfad
        ctx.beginPath()
        ctx.moveTo(scaledPath[0].x - minX, scaledPath[0].y - minY)
        for (let i = 1; i < scaledPath.length; i++) {
          ctx.lineTo(scaledPath[i].x - minX, scaledPath[i].y - minY)
        }
        ctx.closePath()
        ctx.clip()

        // Zeichne den Screenshot-Bereich
        ctx.drawImage(
          sourceCanvas,
          minX, minY, width, height,
          0, 0, width, height
        )

        setPreviewImage(canvas.toDataURL())

        if (ocrMethod === "tesseract") {
          preprocessImage(canvas)
        }
      }

      setScreenshotMode("idle")
      setFreehandPath([])

      if (onReopen) {
        onReopen()
      }

      await processImage(canvas)
    } catch (err) {
      console.error("Screenshot-OCR-Fehler:", err)
      setError("Fehler bei der Screenshot-Verarbeitung.")
      setIsProcessing(false)
      setScreenshotMode("idle")
      setFreehandPath([])
    }
  }

  async function checkAvailableOCRMethods() {
    // Versuche zu prüfen, welche APIs verfügbar sind
    // Standard: Google Vision (kostenlos)
    setOcrMethod("google")
  }

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" } // Rückkamera bevorzugen
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error("Kamera-Fehler:", err)
      setError("Kamera-Zugriff verweigert. Bitte erlauben Sie den Zugriff in den Browser-Einstellungen.")
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  // Verbesserte Bildvorverarbeitung für bessere OCR-Genauigkeit
  function preprocessImage(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return canvas

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const width = canvas.width
    const height = canvas.height

    // Schritt 1: Graustufen-Konvertierung
    const grayscale: number[] = []
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
      grayscale.push(gray)
    }

    // Schritt 2: Adaptive Threshold-Binarisierung (Otsu-ähnlich)
    // Berechne Histogramm
    const histogram = new Array(256).fill(0)
    for (const gray of grayscale) {
      histogram[gray]++
    }

    // Finde optimalen Threshold (vereinfachte Otsu-Methode)
    let threshold = 128
    let maxVariance = 0
    for (let t = 50; t < 200; t++) {
      let w0 = 0, w1 = 0, m0 = 0, m1 = 0
      for (let i = 0; i < 256; i++) {
        if (i < t) {
          w0 += histogram[i]
          m0 += i * histogram[i]
        } else {
          w1 += histogram[i]
          m1 += i * histogram[i]
        }
      }
      if (w0 > 0 && w1 > 0) {
        m0 /= w0
        m1 /= w1
        const variance = w0 * w1 * Math.pow(m0 - m1, 2)
        if (variance > maxVariance) {
          maxVariance = variance
          threshold = t
        }
      }
    }

    // Schritt 3: Binarisierung und Kontrast-Verbesserung
    for (let i = 0; i < data.length; i += 4) {
      const gray = grayscale[i / 4]
      
      // Binarisierung: Schwarz (0) oder Weiß (255)
      const binary = gray < threshold ? 0 : 255
      
      // Starker Kontrast für OCR
      const contrast = binary === 0 ? 0 : 255
      
      data[i] = contrast     // R
      data[i + 1] = contrast // G
      data[i + 2] = contrast // B
      // Alpha bleibt unverändert
    }

    ctx.putImageData(imageData, 0, 0)
    return canvas
  }

  async function recognizeWithGoogleVision(canvas: HTMLCanvasElement): Promise<string | null> {
    try {
      // Canvas zu Blob konvertieren
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Failed to convert canvas to blob"))
        }, "image/jpeg", 0.95)
      })

      // FormData erstellen
      const formData = new FormData()
      formData.append("image", blob, "math-image.jpg")

      // API aufrufen
      const response = await fetch("/api/google-vision", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.warn("Google Vision API error:", errorData)
        return null
      }

      const data = await response.json()
      return data.text || null
    } catch (err) {
      console.error("Google Vision error:", err)
      return null
    }
  }

  async function recognizeWithMathPix(canvas: HTMLCanvasElement): Promise<string | null> {
    try {
      // Canvas zu Blob konvertieren
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Failed to convert canvas to blob"))
        }, "image/jpeg", 0.95)
      })

      // FormData erstellen
      const formData = new FormData()
      formData.append("image", blob, "math-image.jpg")

      // API aufrufen
      const response = await fetch("/api/mathpix", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.warn("MathPix API error:", errorData)
        return null
      }

      const data = await response.json()
      return data.text || null
    } catch (err) {
      console.error("MathPix error:", err)
      return null
    }
  }

  async function recognizeWithTesseract(canvas: HTMLCanvasElement): Promise<string> {
    const worker = await createWorker("eng+deu", 1) // Engine mode 1 (LSTM) beim Erstellen setzen
    
    await worker.setParameters({
      tessedit_pageseg_mode: 8 as any,
      tessedit_char_whitelist: "0123456789+-*/()=.,%sincostanlogsqrtpi^√π×÷: ",
    })

    const { data: { text } } = await worker.recognize(canvas)
    await worker.terminate()
    
    return text
  }

  // Starte Screenshot-Modus
  async function startScreenshot() {
    try {
      // Schließe Dialog temporär für Screenshot
      onClose()
      
      // Warte kurz, damit Dialog geschlossen wird
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Starte Screen Capture
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "screen" } as any,
        audio: false,
      })

      // Erstelle Video-Element für Screenshot
      const video = document.createElement("video")
      video.srcObject = displayStream
      video.play()

      video.onloadedmetadata = async () => {
        // Erstelle Canvas vom gesamten Bildschirm
        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(video, 0, 0)
          screenshotCanvasRef.current = canvas
          
          // Stoppe Stream
          displayStream.getTracks().forEach(track => track.stop())
          video.remove()
          
          // Erstelle Overlay-Element für Bereichsauswahl
          const overlay = document.createElement("div")
          overlay.id = "screenshot-overlay"
          overlay.className = "fixed inset-0 z-[9999] cursor-crosshair"
          overlay.style.background = `url(${canvas.toDataURL()})`
          overlay.style.backgroundSize = "cover"
          overlay.style.backgroundPosition = "center"
          document.body.appendChild(overlay)
          
          // Zeige Overlay für Bereichsauswahl (über gesamten Bildschirm)
          setScreenshotMode("selecting")
        }
      }
    } catch (err) {
      console.error("Screenshot-Fehler:", err)
      setError("Screenshot-Zugriff verweigert. Bitte erlauben Sie den Zugriff.")
      setScreenshotMode("idle")
    }
  }

  // Erfasse ausgewählten Bereich
  async function captureSelection() {
    if (!selectionRect || !screenshotCanvasRef.current) {
      setScreenshotMode("idle")
      return
    }

    setIsProcessing(true)
    setError(null)
    setScreenshotMode("captured")

    try {
      const sourceCanvas = screenshotCanvasRef.current
      const { x, y, width, height } = selectionRect

      // Skaliere Koordinaten relativ zum Canvas
      const scaleX = sourceCanvas.width / window.innerWidth
      const scaleY = sourceCanvas.height / window.innerHeight
      const scaledX = x * scaleX
      const scaledY = y * scaleY
      const scaledWidth = width * scaleX
      const scaledHeight = height * scaleY

      // Erstelle Canvas für den ausgewählten Bereich
      if (!canvasRef.current) return
      const canvas = canvasRef.current
      canvas.width = scaledWidth
      canvas.height = scaledHeight

      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (ctx) {
        // Kopiere den ausgewählten Bereich
        ctx.drawImage(
          sourceCanvas,
          scaledX, scaledY, scaledWidth, scaledHeight,
          0, 0, scaledWidth, scaledHeight
        )

        // Erstelle Preview
        setPreviewImage(canvas.toDataURL())

        // Bildvorverarbeitung (nur für Tesseract)
        if (ocrMethod === "tesseract") {
          preprocessImage(canvas)
        }
      }

      // Verstecke Overlay
      setScreenshotMode("idle")
      setSelectionRect(null)

      // Führe OCR durch
      await processImage(canvas)
    } catch (err) {
      console.error("Screenshot-OCR-Fehler:", err)
      setError("Fehler bei der Screenshot-Verarbeitung.")
      setIsProcessing(false)
      setScreenshotMode("idle")
      setSelectionRect(null)
    }
  }

  // Verarbeite hochgeladenes Bild (nur Preview)
  // Handler für File-Input Click mit Debounce
  const isFileInputClickingRef = useRef(false)
  const handleFileInputClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Verhindere mehrfache Klicks
    if (isProcessing || isFileInputClickingRef.current) {
      console.log('File input click blocked: isProcessing =', isProcessing, 'isFileInputClickingRef.current =', isFileInputClickingRef.current)
      return
    }
    
    isFileInputClickingRef.current = true
    console.log('File input click handler called, fileInputRef.current:', fileInputRef.current)
    
    // Direkter Click
    if (fileInputRef.current) {
      console.log('Clicking file input')
      fileInputRef.current.value = '' // Reset input
      fileInputRef.current.click()
    } else {
      console.error('fileInputRef.current is null!')
      isFileInputClickingRef.current = false
    }
  }, [isProcessing])

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      isFileInputClickingRef.current = false
      return
    }

    // Reset isFileInputClicking state
    isFileInputClickingRef.current = false

    // Prüfe Dateityp
    if (!file.type.startsWith("image/")) {
      setError("Bitte wählen Sie eine Bilddatei aus.")
      return
    }

    setError(null)

    try {
      // Erstelle Preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.onerror = () => {
        setError("Fehler beim Laden des Bildes.")
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error("Upload-Fehler:", err)
      setError("Fehler beim Hochladen des Bildes.")
    }
  }

  async function captureAndRecognize() {
    if (!videoRef.current || !canvasRef.current) return

    setIsProcessing(true)
    setError(null)

    try {
      // Foto aufnehmen mit höherer Auflösung
      const video = videoRef.current
      const canvas = canvasRef.current
      
      // Mindestens 1920x1080 für bessere OCR-Genauigkeit
      const scale = Math.max(1920 / video.videoWidth, 1080 / video.videoHeight, 2)
      canvas.width = video.videoWidth * scale
      canvas.height = video.videoHeight * scale
      
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (ctx) {
        // Bildqualität verbessern
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Bildvorverarbeitung (nur für Tesseract)
        if (ocrMethod === "tesseract") {
          preprocessImage(canvas)
        }
      }

      await processImage(canvas)
    } catch (err) {
      console.error("OCR-Fehler:", err)
      setError("Fehler bei der Texterkennung. Bitte versuchen Sie es erneut.")
      setIsProcessing(false)
    }
  }

  // Gemeinsame OCR-Verarbeitung für Kamera und Upload
  async function processImage(canvas: HTMLCanvasElement) {
    let recognizedText: string | null = null

    // Versuche verschiedene OCR-Methoden basierend auf Konfiguration
    if (ocrMethod === "mathpix") {
      console.log("[OCR] Versuche MathPix...")
      recognizedText = await recognizeWithMathPix(canvas)
      
      if (!recognizedText) {
        console.log("[OCR] MathPix fehlgeschlagen, verwende Google Vision als Fallback")
        recognizedText = await recognizeWithGoogleVision(canvas)
      }
      
      if (!recognizedText) {
        console.log("[OCR] Google Vision fehlgeschlagen, verwende Tesseract als Fallback")
        const tesseractText = await recognizeWithTesseract(canvas)
        recognizedText = improveOCRText(tesseractText)
      }
    } else if (ocrMethod === "google") {
      console.log("[OCR] Versuche Google Vision...")
      recognizedText = await recognizeWithGoogleVision(canvas)
      
      if (!recognizedText) {
        console.log("[OCR] Google Vision fehlgeschlagen, verwende Tesseract als Fallback")
        const tesseractText = await recognizeWithTesseract(canvas)
        recognizedText = improveOCRText(tesseractText)
      }
    } else {
      // Direkt Tesseract verwenden
      console.log("[OCR] Verwende Tesseract...")
      const tesseractText = await recognizeWithTesseract(canvas)
      recognizedText = improveOCRText(tesseractText)
    }

    // Zusätzliche Normalisierung mit Mini-NLP für natürliche Sprache
    if (recognizedText) {
      try {
        const normalized = normalizeInput(recognizedText)
        if (normalized && normalized !== recognizedText) {
          recognizedText = normalized
        }
      } catch (e) {
        console.warn("Normalisierung fehlgeschlagen:", e)
      }
    }

    if (recognizedText && recognizedText.trim()) {
      onTextRecognized(recognizedText.trim())
      stopCamera()
      onClose()
    } else {
      setError("Kein Text erkannt. Bitte versuchen Sie es erneut mit einem klareren Bild.")
    }

    setIsProcessing(false)
  }

  // Verbesserte OCR-Textbereinigung mit aggressiveren Korrekturen
  function improveOCRText(text: string): string {
    let cleaned = text.trim()
    
    console.log("[OCR] Original:", cleaned)

    // 1. Zeilenumbrüche normalisieren
    cleaned = cleaned.replace(/\n/g, " ").replace(/\s+/g, " ")

    // 2. ZUERST: Alle Buchstaben entfernen (muss vor Zahlenerkennung passieren)
    cleaned = cleaned.replace(/[a-zA-Z]/g, "")
    
    // 3. Häufige OCR-Fehler korrigieren - AGRESSIVER
    const corrections: Array<[RegExp, string]> = [
      // Zahlen-Korrekturen
      [/[0oO]/g, "0"], // o, O → 0
      [/[5sS]/g, "5"], // s, S → 5
      [/[1|Il]/g, "1"], // |, I, l → 1
      [/[6gG]/g, "6"], // g, G → 6
      [/[2zZ]/g, "2"], // z, Z → 2
      
      // Plus-Zeichen Korrekturen (häufig falsch erkannt)
      [/[+]/g, "+"], // Plus normalisieren
      [/[-\-]/g, "-"], // Bindestrich normalisieren
      
      // Alles außer erlaubten Zeichen entfernen
      [/[^0-9+\-*/()=.,%\s]/g, ""],
      
      // Mathematische Symbole normalisieren
      [/[×xX]/g, "*"],
      [/[÷:]/g, "/"],
      
      // Funktionen korrigieren (falls doch erkannt)
      [/\bsin\s*\(/gi, "sin("],
      [/\bcos\s*\(/gi, "cos("],
      [/\btan\s*\(/gi, "tan("],
      [/\blog\s*\(/gi, "log("],
      [/\bsqrt\s*\(/gi, "sqrt("],
      [/\bpi\b/gi, "pi"],
      [/π/gi, "pi"],
      [/√/g, "sqrt"],
      
      // Potenzen
      [/\^/g, "^"],
      
      // Leerzeichen um Operatoren entfernen
      [/\s*([+\-*/=])\s*/g, "$1"],
      
      // Leerzeichen vor/nach Klammern entfernen
      [/\s*\(\s*/g, "("],
      [/\s*\)\s*/g, ")"],
      
      // Mehrfache Leerzeichen entfernen
      [/\s+/g, " "],
    ]

    for (const [pattern, replacement] of corrections) {
      const before = cleaned
      cleaned = cleaned.replace(pattern, replacement)
      if (before !== cleaned) {
        console.log(`[OCR] Korrektur: "${before}" → "${cleaned}"`)
      }
    }

    // 3. Spezielle Fallbehandlung: Wenn nur Zahlen und ein Plus erkannt werden sollten
    // Versuche, das Plus-Zeichen zu finden, auch wenn es falsch erkannt wurde
    const numbers = cleaned.match(/\d+/g)
    if (numbers && numbers.length >= 2 && !cleaned.includes("+") && !cleaned.includes("-") && !cleaned.includes("*") && !cleaned.includes("/")) {
      // Wenn wir Zahlen haben aber keinen Operator, füge Plus hinzu
      cleaned = numbers.join("+")
      console.log(`[OCR] Plus hinzugefügt: "${cleaned}"`)
    }

    // 4. Validierung: Muss Zahlen enthalten
    if (!/\d/.test(cleaned)) {
      console.warn("[OCR] Keine Zahlen gefunden:", cleaned)
      return ""
    }

    // 5. Finale Bereinigung
    cleaned = cleaned.trim()
    
    console.log("[OCR] Final:", cleaned)
    return cleaned
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-2xl mx-4 rounded-lg overflow-hidden ${
            appTheme === "light" ? "bg-white" : "bg-zinc-900"
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            appTheme === "light" ? "border-gray-200" : "border-zinc-800"
          }`}>
            <h2 className={`text-lg font-semibold ${
              appTheme === "light" ? "text-gray-900" : "text-white"
            }`}>
              {t("camera.title")}
            </h2>
            <button
              onClick={() => {
                stopCamera()
                isFileInputClickingRef.current = false // Reset beim Schließen
                onClose()
              }}
              className={`p-2 rounded-md transition ${
                appTheme === "light"
                  ? "hover:bg-gray-100 text-gray-600"
                  : "hover:bg-zinc-800 text-zinc-400"
              }`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className={`flex border-b ${
            appTheme === "light" ? "border-gray-200" : "border-zinc-800"
          }`}>
            <button
              onClick={() => {
                setMode("camera")
                setPreviewImage(null)
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                mode === "camera"
                  ? appTheme === "light"
                    ? "bg-gray-100 text-gray-900 border-b-2 border-blue-600"
                    : "bg-zinc-800 text-white border-b-2 border-blue-500"
                  : appTheme === "light"
                    ? "text-gray-600 hover:bg-gray-50"
                    : "text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              <Camera size={18} className="inline-block mr-2" />
              {t("camera.modeCamera")}
            </button>
            <button
              onClick={() => {
                setMode("upload")
                stopCamera()
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                mode === "upload"
                  ? appTheme === "light"
                    ? "bg-gray-100 text-gray-900 border-b-2 border-blue-600"
                    : "bg-zinc-800 text-white border-b-2 border-blue-500"
                  : appTheme === "light"
                    ? "text-gray-600 hover:bg-gray-50"
                    : "text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              <Upload size={18} className="inline-block mr-2" />
              {t("camera.modeUpload")}
            </button>
            <button
              onClick={() => {
                setMode("screenshot")
                stopCamera()
                setPreviewImage(null)
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                mode === "screenshot"
                  ? appTheme === "light"
                    ? "bg-gray-100 text-gray-900 border-b-2 border-blue-600"
                    : "bg-zinc-800 text-white border-b-2 border-blue-500"
                  : appTheme === "light"
                    ? "text-gray-600 hover:bg-gray-50"
                    : "text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              <Monitor size={18} className="inline-block mr-2" />
              {t("camera.modeScreenshot")}
            </button>
          </div>

          {/* File Input - IMMER außerhalb aller Conditional Rendering Blocks */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              console.log('File input onChange triggered', e.target.files)
              handleFileUpload(e)
            }}
            className="hidden"
            key="file-input-unique"
            style={{ display: 'none' }}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Video/Image Preview */}
          <div className="relative bg-black aspect-video">
            {mode === "camera" ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
                {/* Overlay mit Hinweis */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className={`border-2 border-dashed rounded-lg p-4 mb-2 ${
                    appTheme === "light" ? "border-white/50 bg-white/10" : "border-white/30 bg-black/20"
                  }`}>
                    <p className={`text-sm text-center ${
                      appTheme === "light" ? "text-white" : "text-white/80"
                    }`}>
                      {t("camera.instruction")}
                    </p>
                  </div>
                  <div className={`text-xs text-center mt-2 px-4 ${
                    appTheme === "light" ? "text-white/80" : "text-white/60"
                  }`}>
                    <p>{t("camera.tips")}</p>
                  </div>
                </div>
              </>
            ) : mode === "screenshot" ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-8">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <Monitor size={48} className={`mx-auto mb-4 ${
                      appTheme === "light" ? "text-gray-400" : "text-zinc-500"
                    }`} />
                    <p className={`text-sm mb-4 ${
                      appTheme === "light" ? "text-gray-600" : "text-zinc-400"
                    }`}>
                      {t("camera.screenshotDescription")}
                    </p>
                    <button
                      onClick={startScreenshot}
                      disabled={isProcessing || screenshotMode === "selecting"}
                      className={`px-6 py-2 rounded-lg font-medium transition ${
                        isProcessing || screenshotMode === "selecting"
                          ? "bg-gray-400 cursor-not-allowed"
                          : appTheme === "light"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {screenshotMode === "selecting" ? t("camera.screenshotSelecting") : t("camera.screenshotStart")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <Upload size={48} className={`mx-auto mb-4 ${
                      appTheme === "light" ? "text-gray-400" : "text-zinc-500"
                    }`} />
                    <p className={`text-sm mb-4 ${
                      appTheme === "light" ? "text-gray-600" : "text-zinc-400"
                    }`}>
                      {t("camera.uploadInstruction")}
                    </p>
                    <button
                      onClick={handleFileInputClick}
                      disabled={isProcessing}
                      className={`px-6 py-2 rounded-lg font-medium transition ${
                        isProcessing
                          ? "bg-gray-400 cursor-not-allowed"
                          : appTheme === "light"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {t("camera.selectFile")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className={`p-4 bg-red-50 border-t ${
              appTheme === "light" ? "bg-red-50 border-red-200" : "bg-red-950/20 border-red-900/40"
            }`}>
              <p className={`text-sm ${
                appTheme === "light" ? "text-red-800" : "text-red-400"
              }`}>
                {error}
              </p>
            </div>
          )}

          {/* Controls */}
          <div className={`p-4 border-t ${
            appTheme === "light" ? "border-gray-200 bg-gray-50" : "border-zinc-800 bg-zinc-900"
          }`}>
            {mode === "camera" ? (
              <button
                onClick={captureAndRecognize}
                disabled={isProcessing || !stream}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
                  isProcessing || !stream
                    ? "bg-gray-400 cursor-not-allowed"
                    : appTheme === "light"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>{t("camera.processing")}</span>
                  </>
                ) : (
                  <>
                    <Camera size={20} />
                    <span>{t("camera.capture")}</span>
                  </>
                )}
              </button>
            ) : mode === "screenshot" ? (
              previewImage ? (
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (canvasRef.current && previewImage) {
                        setIsProcessing(true)
                        setError(null)
                        const img = new Image()
                        img.onload = async () => {
                          const canvas = canvasRef.current!
                          const maxDimension = 1920
                          const scale = Math.min(maxDimension / img.width, maxDimension / img.height, 1)
                          canvas.width = img.width * scale
                          canvas.height = img.height * scale
                          const ctx = canvas.getContext("2d", { willReadFrequently: true })
                          if (ctx) {
                            ctx.imageSmoothingEnabled = true
                            ctx.imageSmoothingQuality = "high"
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                            if (ocrMethod === "tesseract") {
                              preprocessImage(canvas)
                            }
                          }
                          await processImage(canvas)
                        }
                        img.onerror = () => {
                          setError("Fehler beim Laden des Bildes.")
                          setIsProcessing(false)
                        }
                        img.src = previewImage
                      }
                    }}
                    disabled={isProcessing}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
                      isProcessing
                        ? "bg-gray-400 cursor-not-allowed"
                        : appTheme === "light"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>{t("camera.processing")}</span>
                      </>
                    ) : (
                      <>
                        <Camera size={20} />
                        <span>{t("camera.capture")}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setPreviewImage(null)
                      setScreenshotMode("idle")
                    }}
                    disabled={isProcessing}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
                      isProcessing
                        ? "bg-gray-400 cursor-not-allowed"
                        : appTheme === "light"
                        ? "bg-gray-200 hover:bg-gray-300 text-gray-900"
                        : "bg-zinc-800 hover:bg-zinc-700 text-white"
                    }`}
                  >
                    <X size={20} />
                    {t("camera.selectFile")}
                  </button>
                </div>
              ) : null
            ) : (
              <div className="flex gap-2">
                {previewImage && (
                  <button
                    onClick={async () => {
                      if (canvasRef.current && previewImage) {
                        setIsProcessing(true)
                        setError(null)
                        const img = new Image()
                        img.onload = async () => {
                          const canvas = canvasRef.current!
                          const maxDimension = 1920
                          const scale = Math.min(maxDimension / img.width, maxDimension / img.height, 1)
                          canvas.width = img.width * scale
                          canvas.height = img.height * scale
                          const ctx = canvas.getContext("2d", { willReadFrequently: true })
                          if (ctx) {
                            ctx.imageSmoothingEnabled = true
                            ctx.imageSmoothingQuality = "high"
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                            if (ocrMethod === "tesseract") {
                              preprocessImage(canvas)
                            }
                          }
                          await processImage(canvas)
                        }
                        img.onerror = () => {
                          setError("Fehler beim Laden des Bildes.")
                          setIsProcessing(false)
                        }
                        img.src = previewImage
                      }
                    }}
                    disabled={isProcessing}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
                      isProcessing
                        ? "bg-gray-400 cursor-not-allowed"
                        : appTheme === "light"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>{t("camera.processing")}</span>
                      </>
                    ) : (
                      <>
                        <Camera size={20} />
                        <span>{t("camera.capture")}</span>
                      </>
                    )}
                  </button>
                )}
                {mode !== "upload" && (
                  <button
                    onClick={handleFileInputClick}
                    disabled={isProcessing}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
                      isProcessing
                        ? "bg-gray-400 cursor-not-allowed"
                        : appTheme === "light"
                        ? "bg-gray-200 hover:bg-gray-300 text-gray-900"
                        : "bg-zinc-800 hover:bg-zinc-700 text-white"
                    }`}
                  >
                    <Upload size={20} />
                    {previewImage ? t("camera.selectFile") : t("camera.selectFile")}
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

