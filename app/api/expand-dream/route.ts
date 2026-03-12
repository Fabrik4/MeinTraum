import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { rawText, emotion, persons, places } = await req.json()

    if (!rawText) {
      return NextResponse.json({ error: "Kein Text vorhanden" }, { status: 400 })
    }

    const contextParts: string[] = []
    if (emotion) contextParts.push(`Emotionen: ${emotion}`)
    if (persons?.length > 0) contextParts.push(`Personen: ${persons.join(", ")}`)
    if (places?.length > 0) contextParts.push(`Orte: ${places.join(", ")}`)
    const context = contextParts.length > 0 ? `\nZusätzlicher Kontext:\n${contextParts.join("\n")}` : ""

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: `Du hilfst beim Aufschreiben von Träumen. 
Der Nutzer hat Stichworte oder einen kurzen Text hinterlassen direkt nach dem Aufwachen.
Schreibe daraus einen flüssigen, lesbaren Traumtext in der Ich-Perspektive.
Bleibe nah an den Stichworten – erfinde nichts dazu.
Keine Deutung, keine Analyse. Nur der Traum als zusammenhängender Text.
Schreibe in einfacher, natürlicher Sprache. Max. 3-4 Sätze.
Antworte NUR mit dem Traumtext, kein Präambel, keine Erklärung.`,
      messages: [{
        role: "user",
        content: `Stichworte/Text: ${rawText}${context}`
      }],
    })

    const expanded = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")

    return NextResponse.json({ expanded })
  } catch (error) {
    console.error("Expand-Fehler:", error)
    return NextResponse.json({ error: "Text konnte nicht generiert werden." }, { status: 500 })
  }
}