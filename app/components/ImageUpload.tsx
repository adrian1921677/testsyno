"use client"
import { useState, useRef } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useSettingsStore } from "../lib/settings"
import { createWorker } from "tesseract.js"

interface ImageUploadProps {
  onTextRecognized: (text: string) => void
  onClose: () => void
}

export default function ImageUpload({ onTextRecognized, onClose }: ImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appTheme = useSettingsStore((state) => state.theme)

  const handleFileSelect = () => {
    if (isProcessing) return
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Bitte wählen Sie eine Bilddatei aus.")
      return
    }

    setError(null)

    // Erstelle Preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string)
    }
    reader.onerror = () => {
      setError("Fehler beim Laden des Bildes.")
    }
    reader.readAsDataURL(file)
  }

  const processImage = async () => {
    if (!previewImage || !canvasRef.current) return

    setIsProcessing(true)
    setError(null)

    try {
      const img = new Image()
      img.onload = async () => {
        try {
          const canvas = canvasRef.current!
          const maxDimension = 1920
          const scale = Math.min(maxDimension / img.width, maxDimension / img.height, 1)
          canvas.width = img.width * scale
          canvas.height = img.height * scale
          
          const ctx = canvas.getContext("2d", { willReadFrequently: true })
          if (!ctx) {
            throw new Error("Canvas context nicht verfügbar")
          }

          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          // OCR mit Tesseract.js
          const worker = await createWorker('deu+eng')
          const { data: { text } } = await worker.recognize(canvas)
          await worker.terminate()

          // Bereinige den Text
          const cleanedText = text
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/[^\d+\-*/().,\s%]/g, '')
            .trim()

          if (cleanedText) {
            onTextRecognized(cleanedText)
            onClose()
          } else {
            setError("Keine mathematische Aufgabe erkannt.")
            setIsProcessing(false)
          }
        } catch (err) {
          console.error("OCR-Fehler:", err)
          setError("Fehler bei der Texterkennung.")
          setIsProcessing(false)
        }
      }
      img.onerror = () => {
        setError("Fehler beim Laden des Bildes.")
        setIsProcessing(false)
      }
      img.src = previewImage
    } catch (err) {
      console.error("Verarbeitungsfehler:", err)
      setError("Fehler bei der Bildverarbeitung.")
      setIsProcessing(false)
    }
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
              Bild hochladen
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-md transition ${
                appTheme === "light"
                  ? "hover:bg-gray-100 text-gray-600"
                  : "hover:bg-zinc-800 text-zinc-400"
              }`}
            >
              <X size={20} />
            </button>
          </div>

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            style={{ display: 'none' }}
            id="file-input-upload"
            disabled={isProcessing}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Content */}
          <div className="p-8">
            {previewImage ? (
              <div className="text-center">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="max-w-full max-h-96 object-contain rounded-lg mx-auto mb-4"
                />
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={processImage}
                    disabled={isProcessing}
                    className={`px-6 py-2 rounded-lg font-medium transition ${
                      isProcessing
                        ? "bg-gray-400 cursor-not-allowed"
                        : appTheme === "light"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={20} className="animate-spin inline-block mr-2" />
                        Verarbeitung...
                      </>
                    ) : (
                      "Aufgabe erkennen"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setPreviewImage(null)
                      setError(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    disabled={isProcessing}
                    className={`px-6 py-2 rounded-lg font-medium transition ${
                      isProcessing
                        ? "bg-gray-400 cursor-not-allowed"
                        : appTheme === "light"
                        ? "bg-gray-200 hover:bg-gray-300 text-gray-900"
                        : "bg-zinc-800 hover:bg-zinc-700 text-white"
                    }`}
                  >
                    <X size={20} className="inline-block mr-2" />
                    Zurück
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Upload size={64} className={`mx-auto mb-4 ${
                  appTheme === "light" ? "text-gray-400" : "text-zinc-500"
                }`} />
                <p className={`text-sm mb-4 ${
                  appTheme === "light" ? "text-gray-600" : "text-zinc-400"
                }`}>
                  Wählen Sie ein Bild mit einer mathematischen Aufgabe aus
                </p>
                {isProcessing ? (
                  <span className={`px-6 py-2 rounded-lg font-medium transition inline-block bg-gray-400 cursor-not-allowed`}>
                    Datei auswählen
                  </span>
                ) : (
                  <label htmlFor="file-input-upload" className="inline-block cursor-pointer">
                    <span className={`px-6 py-2 rounded-lg font-medium transition inline-block ${
                      appTheme === "light"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}>
                      Datei auswählen
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className={`p-4 border-t ${
              appTheme === "light" ? "bg-red-50 border-red-200" : "bg-red-950/20 border-red-900/40"
            }`}>
              <p className={`text-sm ${
                appTheme === "light" ? "text-red-800" : "text-red-400"
              }`}>
                {error}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
