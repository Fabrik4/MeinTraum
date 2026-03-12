import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audio = formData.get("audio") as File | null

    if (!audio) {
      return NextResponse.json({ error: "Keine Audiodatei" }, { status: 400 })
    }

    // Whisper API via OpenAI
    const whisperForm = new FormData()
    whisperForm.append("file", audio, "audio.webm")
    whisperForm.append("model", "whisper-1")
    whisperForm.append("language", "de")
    whisperForm.append("prompt", "Traumtagebuch, persönliche Reflexion, Schweizerdeutsch oder Hochdeutsch möglich.")

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: whisperForm,
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("Whisper error:", err)
      return NextResponse.json({ error: "Transkription fehlgeschlagen" }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json({ text: data.text })

  } catch (error) {
    console.error("Transcribe error:", error)
    return NextResponse.json({ error: "Fehler bei der Transkription" }, { status: 500 })
  }
}