import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { rawText, moodScore, tags } = await req.json()
    if (!rawText) return NextResponse.json({ error: "Kein Text vorhanden" }, { status: 400 })

    const contextParts: string[] = []
    if (moodScore) contextParts.push(`Stimmung: ${moodScore}/10`)
    if (tags?.length > 0) contextParts.push(`Themen: ${tags.join(", ")}`)
    const context = contextParts.length > 0 ? `\nKontext: ${contextParts.join(" | ")}` : ""

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: `Du hilfst beim Schreiben von Tagebuch- und Stimmungseinträgen.
Der Nutzer hat Stichworte oder kurze Notizen hinterlassen.
Schreibe daraus einen flüssigen, persönlichen Tagebucheintrag in der Ich-Perspektive.
Bleibe nah an den Stichworten – erfinde nichts dazu.
Natürliche, ehrliche Sprache. Kein Therapeuten-Jargon.
Max. 3-4 Sätze. Antworte NUR mit dem Text, kein Präambel.`,
      messages: [{ role: "user", content: `Stichworte: ${rawText}${context}` }],
    })

    const expanded = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")

    return NextResponse.json({ expanded })
  } catch (error) {
    console.error("Expand-Journal-Fehler:", error)
    return NextResponse.json({ error: "Text konnte nicht generiert werden." }, { status: 500 })
  }
}