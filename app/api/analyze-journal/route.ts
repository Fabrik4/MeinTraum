import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODE_PROMPTS: Record<string, string> = {
  psychological: `Du bist ein einfühlsamer Begleiter mit psychologischem Hintergrund.
Analysiere den folgenden Tagebuch-/Stimmungseintrag neutral und reflektiert.
Nutze vorsichtige Sprache: "könnte bedeuten", "wird oft assoziiert mit", "mögliche Deutung".
Keine absoluten Aussagen. Keine Diagnosen.
Antworte NUR mit diesem JSON:
{
  "summary": "2-3 Sätze Zusammenfassung",
  "themes": ["Thema 1", "Thema 2"],
  "emotions": ["Emotion 1", "Emotion 2"],
  "reflection": "3-4 Sätze psychologische Reflexion",
  "question": "Eine offene Reflexionsfrage",
  "caution": "Kurzer Hinweis dass dies keine Therapie ersetzt"
}`,
  poetic: `Du bist ein poetischer Begleiter mit Sinn für Metaphern.
Antworte NUR mit diesem JSON:
{
  "summary": "2-3 poetische Sätze",
  "themes": ["Symbol 1", "Symbol 2"],
  "emotions": ["Stimmung 1", "Stimmung 2"],
  "reflection": "3-4 bildhafte Sätze",
  "question": "Eine poetische Frage",
  "caution": "Hinweis dass dies eine kreative Interpretation ist"
}`,
  humorous: `Du bist ein humorvoller Kommentator. Sei witzig aber respektvoll.
Antworte NUR mit diesem JSON:
{
  "summary": "2-3 amüsante Sätze",
  "themes": ["Beobachtung 1", "Beobachtung 2"],
  "emotions": ["Gefühl 1", "Gefühl 2"],
  "reflection": "3-4 humorvolle aber nachdenkliche Sätze",
  "question": "Eine lustige aber echte Frage",
  "caution": "Lockerer Hinweis"
}`,
  scientific: `Du bist ein sachlicher Psychologe/Neurowissenschaftler.
Antworte NUR mit diesem JSON:
{
  "summary": "2-3 sachliche Sätze",
  "themes": ["Muster 1", "Muster 2"],
  "emotions": ["Verarbeitetes Gefühl 1", "Gefühl 2"],
  "reflection": "3-4 Sätze wissenschaftliche Erklärung",
  "question": "Eine analytische Frage",
  "caution": "Hinweis zu Grenzen der Analyse"
}`,
}

export async function POST(req: NextRequest) {
  try {
    const { entryText, emotion, moodScore, energyLevel, sleepHours, tags, entities, mode } = await req.json()
    if (!entryText || !mode) return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 })

    const systemPrompt = MODE_PROMPTS[mode]
    if (!systemPrompt) return NextResponse.json({ error: "Ungültiger Modus" }, { status: 400 })

    const contextParts: string[] = [`Tagebucheintrag: ${entryText}`]
    if (emotion) contextParts.push(`Emotionen: ${emotion}`)
    if (moodScore) contextParts.push(`Stimmung: ${moodScore}/10`)
    if (energyLevel) contextParts.push(`Energie: ${energyLevel}/5`)
    if (sleepHours) contextParts.push(`Schlaf: ${sleepHours}h`)
    if (tags?.length) contextParts.push(`Themen: ${tags.join(", ")}`)
    if (entities?.persons?.length) contextParts.push(`Personen: ${entities.persons.join(", ")}`)
    if (entities?.places?.length) contextParts.push(`Orte: ${entities.places.join(", ")}`)

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt + "\n\nNur JSON, kein Markdown, kein Text davor oder danach.",
      messages: [{ role: "user", content: contextParts.join("\n") }],
    })

    const raw = message.content.filter((b) => b.type === "text").map((b) => (b as any).text).join("")
    const cleaned = raw.replace(/```json|```/g, "").trim()
    let analysis
    try {
      analysis = JSON.parse(cleaned)
    } catch {
      console.error("JSON-Parse-Fehler:", cleaned)
      return NextResponse.json({ error: "Analyse konnte nicht verarbeitet werden." }, { status: 500 })
    }
    return NextResponse.json({ analysis, mode })
  } catch (error) {
    console.error("Journal-Analyse-Fehler:", error)
    return NextResponse.json({ error: "Analyse konnte nicht erstellt werden." }, { status: 500 })
  }
}