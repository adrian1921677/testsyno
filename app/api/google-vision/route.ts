import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get("image") as File

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const googleVisionApiKey = process.env.GOOGLE_VISION_API_KEY

    if (!googleVisionApiKey) {
      return NextResponse.json(
        { error: "Google Vision API key not configured" },
        { status: 500 }
      )
    }

    // Konvertiere File zu Base64
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString("base64")

    // Google Cloud Vision API aufrufen
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: "TEXT_DETECTION",
                },
              ],
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Google Vision API error:", errorData)
      return NextResponse.json(
        { error: "Google Vision API request failed", details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Extrahiere den erkannten Text
    const textAnnotations = data.responses?.[0]?.textAnnotations
    let recognizedText = ""

    if (textAnnotations && textAnnotations.length > 0) {
      // Der erste Eintrag enthält den gesamten Text
      recognizedText = textAnnotations[0].description || ""
    }

    // Bereinige den Text für mathematische Ausdrücke
    recognizedText = recognizedText
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[^\d+\-*/().,\s%^√]/g, "")
      .trim()

    return NextResponse.json({ text: recognizedText })
  } catch (error) {
    console.error("Google Vision API error:", error)
    return NextResponse.json(
      { error: "Failed to process image", details: String(error) },
      { status: 500 }
    )
  }
}