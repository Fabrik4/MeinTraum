import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json()
    if (!user_id) return NextResponse.json({ error: "user_id fehlt" }, { status: 400 })

    const supabase = getSupabase()
    const { data: stats, error } = await supabase.rpc("get_weekly_review", { p_user_id: user_id })
    if (error || !stats) return NextResponse.json({ error: "Daten konnten nicht geladen werden" }, { status: 500 })

    // Bei leerer Woche keine KI-Kosten
    if (!stats.dream_count && !stats.journal_count && !stats.checkin_count) {
      return NextResponse.json({ stats, hypothesis: "", question: "" })
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: `Du bist ein einfühlsamer Traumbegleiter.
Analysiere die Traumdaten der letzten 7 Tage und schreibe eine kurze, persönliche Hypothese
(2-3 Sätze, deutsch, nicht esoterisch, ehrlich).
Schliesse mit einer Reflexionsfrage für die kommende Woche.
Antworte als JSON ohne Markdown: { "hypothesis": string, "question": string }`,
      messages: [{ role: "user", content: JSON.stringify(stats) }],
    })

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim()

    let hypothesis = ""
    let question = ""
    try {
      const clean = text.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(clean)
      hypothesis = parsed.hypothesis ?? ""
      question = parsed.question ?? ""
    } catch {
      return NextResponse.json({ error: "Parsing fehlgeschlagen" }, { status: 500 })
    }

    return NextResponse.json({ stats, hypothesis, question })
  } catch (error) {
    console.error("Weekly-Review Fehler:", error)
    return NextResponse.json({ error: "Fehler beim Erstellen des Rückblicks" }, { status: 500 })
  }
}
