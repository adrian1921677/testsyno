import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  rating: z.number().int().min(0).max(5),
  message: z.string().max(1000).optional().default(""),
  email: z.string().email().optional(),
  mode: z.string().optional(),
  ua: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const RESEND_API_KEY = process.env.RESEND_API_KEY
    const FEEDBACK_TO = process.env.FEEDBACK_TO

    if (!RESEND_API_KEY || !FEEDBACK_TO) {
      console.log("[FEEDBACK]", data)
      return NextResponse.json({ ok: true, dev: true })
    }

    const { Resend } = await import("resend")
    const resend = new Resend(RESEND_API_KEY)

    const subject = `Syno Feedback ★${data.rating} (${data.mode ?? "unknown"})`
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#111">
        <h2>Syno Feedback</h2>
        <p><b>Rating:</b> ${"★".repeat(data.rating)}${"☆".repeat(5 - data.rating)} (${data.rating}/5)</p>
        <p><b>Mode:</b> ${data.mode ?? "-"}</p>
        <p><b>Email (optional):</b> ${data.email ?? "-"}</p>
        <p><b>Message:</b><br>${(data.message ?? "").replace(/\n/g, "<br/>")}</p>
        <hr/>
        <p style="color:#666"><b>User-Agent:</b> ${data.ua ?? "-"}</p>
        <p style="color:#666"><b>Time:</b> ${new Date().toISOString()}</p>
      </div>
    `

    await resend.emails.send({
      from: "Syno Feedback <feedback@your-domain.com>",
      to: FEEDBACK_TO,
      subject,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ ok: false, error: err?.message ?? "error" }, { status: 400 })
  }
}


