import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get("image") as File

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const mathpixAppId = process.env.MATHPIX_APP_ID
    const mathpixAppKey = process.env.MATHPIX_APP_KEY

    if (!mathpixAppId || !mathpixAppKey) {
      return NextResponse.json(
        { error: "MathPix API credentials not configured" },
        { status: 500 }
      )
    }

    // Konvertiere File zu Base64
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString("base64")

    // MathPix API aufrufen
    const response = await fetch("https://api.mathpix.com/v3/text", {
      method: "POST",
      headers: {
        app_id: mathpixAppId,
        app_key: mathpixAppKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        src: `data:image/jpeg;base64,${base64Image}`,
        formats: ["text", "latex"],
        data_options: {
          include_asciimath: true,
          include_latex: true,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("MathPix API error:", errorData)
      return NextResponse.json(
        { error: "MathPix API request failed", details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Bevorzuge LaTeX, dann AsciiMath, dann Text
    let recognizedText = data.latex || data.asciimath || data.text || ""
    
    // Konvertiere LaTeX zu einfacher Mathematik-Syntax
    if (data.latex) {
      recognizedText = convertLatexToMath(recognizedText)
    }

    return NextResponse.json({ text: recognizedText })
  } catch (error) {
    console.error("MathPix API error:", error)
    return NextResponse.json(
      { error: "Failed to process image", details: String(error) },
      { status: 500 }
    )
  }
}

// Konvertiert LaTeX zu einfacher Mathematik-Syntax
function convertLatexToMath(latex: string): string {
  return latex
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)") // \frac{a}{b} -> (a)/(b)
    .replace(/\\sqrt\{([^}]+)\}/g, "sqrt($1)") // \sqrt{x} -> sqrt(x)
    .replace(/\\sqrt\[(\d+)\]\{([^}]+)\}/g, "($2)^(1/$1)") // \sqrt[n]{x} -> (x)^(1/n)
    .replace(/\\left\(/g, "(")
    .replace(/\\right\)/g, ")")
    .replace(/\\cdot/g, "*")
    .replace(/\\times/g, "*")
    .replace(/\\div/g, "/")
    .replace(/\\pi/g, "pi")
    .replace(/\\sin/g, "sin")
    .replace(/\\cos/g, "cos")
    .replace(/\\tan/g, "tan")
    .replace(/\\log/g, "log")
    .replace(/\\ln/g, "ln")
    .replace(/\^\{([^}]+)\}/g, "^$1") // ^{x} -> ^x
    .replace(/\_\{([^}]+)\}/g, "_$1") // _{x} -> _x
    .replace(/\{/g, "")
    .replace(/\}/g, "")
    .replace(/\\/g, "")
    .trim()
}


