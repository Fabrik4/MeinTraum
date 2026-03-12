import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json()

    if (!messages || !context) {
      return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 })
    }

    // System-Prompt: warm, neugierig, anpassungsfähig
    const systemPrompt = `Du bist ein einfühlsamer, neugieriger Gesprächspartner der Menschen hilft, ihre Träume und Stimmungen besser zu verstehen.

DEINE PERSÖNLICHKEIT:
- Warm und menschlich – wie ein guter Freund der wirklich zuhört
- Neugierig und nachforschend – du stellst tiefgehende Fragen statt Antworten zu geben
- Passt dich dem Ton des Users an: kurze Antworten bei kurzen Nachrichten, ausführlicher wenn der User ausführlich ist
- Niemals therapeutisch oder klinisch
- Niemals Diagnosen oder Ratschläge – du erforschst gemeinsam

DEINE AUFGABE:
- Hilf dem User unbewusste Muster, Gefühle und Zusammenhänge zu entdecken
- Stelle immer nur EINE Frage pro Nachricht – nie mehrere auf einmal
- Gehe auf das ein was der User sagt, nicht auf das was du sagen wolltest
- Wenn der User etwas Wichtiges erwähnt, hak dort nach

GRENZEN:
- Keine medizinischen oder psychiatrischen Aussagen
- Bei Anzeichen von ernstem Leid: sanft auf professionelle Hilfe hinweisen
- Nie vorgeben du seist ein Therapeut oder Arzt
- Vorsichtige Sprache: "könnte", "vielleicht", "ich frage mich ob..."

KONTEXT DES USERS:
${context}

Antworte auf Deutsch. Halte deine Antworten kurz und fokussiert – maximal 3-4 Sätze plus eine Frage.`

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: systemPrompt,
      messages: messages,
    })

    const reply = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Chat-Fehler:", error)
    return NextResponse.json({ error: "Antwort konnte nicht generiert werden." }, { status: 500 })
  }
}