import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"
import { buildTierOneContext, formatContextForAI } from "@/lib/contextBuilder"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const { userId, timeRange, stats } = await req.json()
    if (!userId) return NextResponse.json({ error: "userId fehlt" }, { status: 400 })

    // Tier-1 Kontext laden
    const tier1 = await buildTierOneContext(userId)
    const userContext = formatContextForAI(tier1, { currentEntry: null, recentEntries: [] })

    const prompt = `Du analysierst die Muster im Traum- und Stimmungsarchiv eines Menschen.

NUTZERKONTEXT:
${userContext}

STATISTIKEN (letzte ${timeRange} Tage):
- Träume erfasst: ${stats.totalDreams}
- Journaleinträge: ${stats.totalJournal}
- Ø Stimmung 7 Tage: ${stats.moodAvg7d ?? "–"}/10
- Ø Stimmung 30 Tage: ${stats.moodAvg30d ?? "–"}/10
- Stimmungstrend: ${stats.moodTrend ?? "unbekannt"}
- Häufigste Emotionen: ${stats.topEmotions?.join(", ") || "keine"}
- Wiederkehrende Personen: ${stats.topPersons?.join(", ") || "keine"}
- Wiederkehrende Orte: ${stats.topPlaces?.join(", ") || "keine"}
- Albtraum-Rate: ${stats.nightmareRate}%
- Traumstimmungen: ${stats.dreamTones?.nightmare ?? 0} Albträume, ${stats.dreamTones?.neutral ?? 0} neutral, ${stats.dreamTones?.pleasant ?? 0} schön

Erstelle eine kurze, persönliche Musteranalyse. Antworte NUR mit validem JSON ohne Markdown:
{
  "patterns": "2-3 Sätze über erkennbare Muster in Träumen und Stimmung",
  "connections": "1-2 Sätze über mögliche Verbindungen zwischen Träumen und Tagesgeschehen",
  "question": "Eine einzige, tiefgehende Reflexionsfrage für den User"
}

Wichtig: Vorsichtige Sprache ("könnte", "scheint", "fällt auf"). Keine Diagnosen. Persönlich und warm.`

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    })

    const text = message.content.filter((b) => b.type === "text").map((b) => (b as any).text).join("").trim()

    let insight
    try {
      const clean = text.replace(/```json|```/g, "").trim()
      insight = JSON.parse(clean)
    } catch {
      return NextResponse.json({ error: "Parsing fehlgeschlagen" }, { status: 500 })
    }

    return NextResponse.json({ insight })

  } catch (error) {
    console.error("Pattern-Insight Fehler:", error)
    return NextResponse.json({ error: "Analyse fehlgeschlagen" }, { status: 500 })
  }
}