import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODE_PROMPTS: Record<string, string> = {
  psychological: `Du bist ein einfühlsamer Traumanalyst mit psychologischem Hintergrund.
Analysiere den folgenden Traum neutral und reflektiert.
Nutze vorsichtige Sprache: "könnte bedeuten", "wird oft assoziiert mit", "mögliche Deutung".
Keine absoluten Aussagen. Keine Diagnosen. Kein Esoterik.
Struktur deiner Antwort (in JSON):
{
  "summary": "2-3 Sätze Zusammenfassung des Traums",
  "themes": ["Thema 1", "Thema 2"],
  "emotions": ["Emotion 1", "Emotion 2"],
  "reflection": "3-4 Sätze psychologische Reflexion mit vorsichtiger Sprache",
  "question": "Eine offene Reflexionsfrage für den Träumer",
  "caution": "Kurzer Hinweis dass dies keine Therapie ersetzt"
}`,

  poetic: `Du bist ein poetischer Traumdeuter mit einem Sinn für Märchen und Symbolik.
Analysiere den folgenden Traum in einer bildhaften, poetischen Sprache.
Nutze Metaphern und Symbole, bleibe aber transparent dass es Interpretationen sind.
Struktur deiner Antwort (in JSON):
{
  "summary": "2-3 poetische Sätze die den Traum einfangen",
  "themes": ["Symbol 1", "Symbol 2"],
  "emotions": ["Stimmung 1", "Stimmung 2"],
  "reflection": "3-4 Sätze märchenhafte Deutung mit Bildern und Metaphern",
  "question": "Eine poetische Frage zur Reflexion",
  "caution": "Kurzer Hinweis dass dies eine kreative Interpretation ist"
}`,

  humorous: `Du bist ein humorvoller Traumkommentator der Träume mit einem Augenzwinkern deutet.
Sei witzig aber respektvoll. Keine Beleidigungen. Leichte, lockere Sprache.
Struktur deiner Antwort (in JSON):
{
  "summary": "2-3 amüsante Sätze zum Traum",
  "themes": ["Beobachtung 1", "Beobachtung 2"],
  "emotions": ["Gefühl 1", "Gefühl 2"],
  "reflection": "3-4 humorvolle aber dennoch nachdenkliche Sätze",
  "question": "Eine lustige aber echte Reflexionsfrage",
  "caution": "Lockerer Hinweis dass das alles nicht zu ernst zu nehmen ist"
}`,

  scientific: `Du bist ein sachlicher Neurowissenschaftler der Träume aus wissenschaftlicher Sicht erklärt.
Erkläre was im Gehirn passiert, welche Hirnregionen aktiv sind, was Schlafforschung dazu sagt.
Keine mystischen Deutungen. Fakten und Forschungsstand.
Nutze trotzdem verständliche Sprache – kein Fachjargon ohne Erklärung.
Struktur deiner Antwort (in JSON):
{
  "summary": "2-3 sachliche Sätze was im Traum passierte",
  "themes": ["Neuronales Muster 1", "Muster 2"],
  "emotions": ["Verarbeitetes Gefühl 1", "Gefühl 2"],
  "reflection": "3-4 Sätze neurowissenschaftliche Erklärung mit Forschungsbezug",
  "question": "Eine analytische Frage zur Selbstbeobachtung",
  "caution": "Hinweis dass Traumforschung noch viele offene Fragen hat"
}`,
}

export async function POST(req: NextRequest) {
  try {
    const { dreamText, emotion, clarity, tone, entities, mode } = await req.json()

    if (!dreamText || !mode) {
      return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 })
    }

    const systemPrompt = MODE_PROMPTS[mode]
    if (!systemPrompt) {
      return NextResponse.json({ error: "Ungültiger Modus" }, { status: 400 })
    }

    // Kontext aufbauen
    const contextParts: string[] = [`Trauminhalt: ${dreamText}`]
    if (emotion) contextParts.push(`Dominante Emotion(en): ${emotion}`)
    if (clarity) contextParts.push(`Klarheit des Traums: ${clarity}`)
    if (tone) contextParts.push(`Stimmung: ${tone === "nightmare" ? "Albtraum" : tone === "pleasant" ? "Schöner Traum" : "Neutral"}`)
    if (entities?.persons?.length > 0) contextParts.push(`Personen im Traum: ${entities.persons.join(", ")}`)
    if (entities?.places?.length > 0) contextParts.push(`Orte im Traum: ${entities.places.join(", ")}`)

    const userMessage = contextParts.join("\n")

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt + "\n\nAntworte NUR mit dem JSON-Objekt. Kein Text davor oder danach. Kein Markdown.",
      messages: [{ role: "user", content: userMessage }],
    })

    const responseText = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("")

    // JSON parsen
    const cleaned = responseText.replace(/```json|```/g, "").trim()
    const analysis = JSON.parse(cleaned)

    return NextResponse.json({ analysis, mode })
  } catch (error) {
    console.error("Analyse-Fehler:", error)
    return NextResponse.json({ error: "Analyse konnte nicht erstellt werden." }, { status: 500 })
  }
}