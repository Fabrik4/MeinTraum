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
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: "userId fehlt" }, { status: 400 })

    const supabase = getSupabase()

    // ── Daten laden ───────────────────────────────────────────
    const [dreamsRes, journalsRes, existingSummaryRes, entitiesRes] = await Promise.all([
      supabase.from("dream_entries")
        .select("raw_input_text, dominant_emotion, dream_tone, dreamed_at, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),

      supabase.from("journal_entries")
        .select("body_text, dominant_emotion, mood_score, energy_level, tags, entry_date, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),

      supabase.from("user_summaries")
        .select("summary_text, covers_to")
        .eq("user_id", userId)
        .order("generated_at", { ascending: false })
        .limit(1).maybeSingle(),

      supabase.from("user_entities")
        .select("entity_type, entity_label, updated_at")
        .eq("user_id", userId)
        .eq("is_confirmed", true)
        .order("updated_at", { ascending: false })
        .limit(30),
    ])

    const dreams = dreamsRes.data ?? []
    const journals = journalsRes.data ?? []
    const existingSummary = existingSummaryRes.data

    // Stimmungs-Durchschnitte berechnen
    const now = Date.now()
    const moodEntries = journals.filter((j: any) => j.mood_score)
    const avg = (days: number) => {
      const cutoff = now - days * 864e5
      const filtered = moodEntries.filter((j: any) => new Date(j.created_at).getTime() > cutoff)
      if (!filtered.length) return null
      return Math.round(filtered.reduce((s: number, j: any) => s + j.mood_score, 0) / filtered.length * 10) / 10
    }

    // Wiederkehrende Entities extrahieren
    const persons = (entitiesRes.data ?? []).filter((e: any) => e.entity_type === "person").map((e: any) => e.entity_label)
    const places  = (entitiesRes.data ?? []).filter((e: any) => e.entity_type === "place").map((e: any) => e.entity_label)

    // Häufigste Emotionen
    const allEmotions = [
      ...dreams.flatMap((d: any) => d.dominant_emotion?.split(", ").filter(Boolean) ?? []),
      ...journals.flatMap((j: any) => j.dominant_emotion?.split(", ").filter(Boolean) ?? []),
    ]
    const emotionCounts: Record<string, number> = {}
    allEmotions.forEach((e) => { emotionCounts[e] = (emotionCounts[e] ?? 0) + 1 })
    const topEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 6).map(([e]) => e)

    // ── KI-Prompt zusammenbauen ───────────────────────────────
    const dreamSnippets = dreams.slice(0, 20).map((d: any) => {
      const date = new Date(d.dreamed_at || d.created_at).toLocaleDateString("de-CH", { day: "numeric", month: "short" })
      const emotion = d.dominant_emotion ? ` [${d.dominant_emotion}]` : ""
      return `${date}: ${d.raw_input_text?.slice(0, 150)}${emotion}`
    }).join("\n")

    const journalSnippets = journals.slice(0, 20).map((j: any) => {
      const date = new Date(j.entry_date || j.created_at).toLocaleDateString("de-CH", { day: "numeric", month: "short" })
      const mood = j.mood_score ? ` [Stimmung ${j.mood_score}/10]` : ""
      return `${date}: ${j.body_text?.slice(0, 150)}${mood}`
    }).join("\n")

    const existingContext = existingSummary
      ? `\nBestehende Zusammenfassung (erweitern, nicht ersetzen):\n${existingSummary.summary_text}`
      : ""

    const prompt = `Du erstellst eine kompakte, kumulative Zusammenfassung des inneren Lebens eines Menschen basierend auf seinen Traum- und Tagebucheinträgen.

ZIEL: Eine dichte, nützliche Zusammenfassung die einer KI hilft, diesem Menschen in zukünftigen Gesprächen bessere, persönlichere Antworten zu geben.

FORMAT: Fliesstext, max. 300 Wörter. Keine Listen. Fokus auf Muster, Themen, Entwicklungen – nicht einzelne Ereignisse.

INHALT SOLL ENTHALTEN:
- Wiederkehrende Themen in Träumen und Stimmungen
- Erkennbare Lebensphasen oder Veränderungen
- Emotionale Grundmuster
- Was den Menschen beschäftigt
- Wie sich Stimmung und Energie entwickeln
${existingContext}

NEUE EINTRÄGE:

Träume (neueste zuerst):
${dreamSnippets || "Keine Traumeinträge"}

Tagebuch (neueste zuerst):
${journalSnippets || "Keine Journaleinträge"}

Antworte NUR mit dem Zusammenfassungstext, kein Präambel, kein JSON.`

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    })

    const summaryText = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as any).text)
      .join("").trim()

    // ── In DB speichern ───────────────────────────────────────
    const oldestDream = dreams[dreams.length - 1]
    const oldestJournal = journals[journals.length - 1]
    const coversFrom = [
      oldestDream?.dreamed_at || oldestDream?.created_at,
      oldestJournal?.entry_date || oldestJournal?.created_at,
    ].filter(Boolean).sort()[0]?.slice(0, 10)

    await supabase.from("user_summaries").insert({
      user_id: userId,
      summary_text: summaryText,
      recurring_persons: persons.slice(0, 10),
      recurring_places: places.slice(0, 10),
      recurring_emotions: topEmotions,
      mood_avg_7d: avg(7),
      mood_avg_30d: avg(30),
      mood_avg_90d: avg(90),
      total_dreams: dreams.length,
      total_journal: journals.length,
      covers_from: coversFrom ?? null,
      covers_to: new Date().toISOString().slice(0, 10),
    })

    return NextResponse.json({
      summary: summaryText,
      stats: {
        dreams: dreams.length,
        journals: journals.length,
        mood_avg_30d: avg(30),
        top_emotions: topEmotions,
        persons: persons.slice(0, 5),
        places: places.slice(0, 5),
      }
    })

  } catch (error) {
    console.error("Summary-Fehler:", error)
    return NextResponse.json({ error: "Zusammenfassung konnte nicht generiert werden." }, { status: 500 })
  }
}