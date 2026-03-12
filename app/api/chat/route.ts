import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"
import { buildTierOneContext, buildTierTwoContext, formatContextForAI } from "@/lib/contextBuilder"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const SYSTEM_PROMPT = `Du bist ein einfühlsamer, neugieriger Gesprächspartner der Menschen hilft, ihre Träume und Stimmungen besser zu verstehen.

DEINE PERSÖNLICHKEIT:
- Warm und menschlich – wie ein guter Freund der wirklich zuhört
- Neugierig und nachforschend – du stellst tiefgehende Fragen statt Antworten zu geben
- Passt dich dem Ton des Users an: kurze Antworten bei kurzen Nachrichten, ausführlicher wenn der User ausführlich ist
- Nutze den Kontext aktiv – wenn du Muster erkennst, sprich sie behutsam an
- Niemals therapeutisch oder klinisch klingend
- Keine Diagnosen oder Ratschläge – du erforschst gemeinsam

KONTEXT NUTZEN:
- Wenn Keyereignisse relevant sind, beziehe dich darauf
- Wenn Stimmungstrends sichtbar sind, erwähne sie vorsichtig
- Wenn wiederkehrende Personen/Orte auftauchen, frage nach
- Vermeide es wie ein Protokoll zu klingen – sei natürlich

GRENZEN:
- Keine medizinischen oder psychiatrischen Aussagen
- Bei Anzeichen von ernstem Leid: sanft auf professionelle Hilfe hinweisen
- Nie vorgeben du seist ein Therapeut oder Arzt
- Vorsichtige Sprache: "könnte", "vielleicht", "ich frage mich ob..."

Antworte auf Deutsch. Maximal 3-4 Sätze plus eine Frage. Stelle immer nur EINE Frage pro Nachricht.`

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      sessionId,
      userId,
      sessionType = "free",
      linkedDreamId,
      linkedJournalId,
      currentEntryText,
    } = await req.json()

    if (!messages || !userId) {
      return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 })
    }

    const supabase = getSupabase()

    // ── Zwei-Stufen-Kontext aufbauen ──────────────────────────
    const [tier1, tier2] = await Promise.all([
      buildTierOneContext(userId),
      buildTierTwoContext(userId, {
        currentDreamId: linkedDreamId,
        currentJournalId: linkedJournalId,
      }),
    ])

    const fullContext = formatContextForAI(tier1, tier2, currentEntryText)

    // ── KI-Anfrage ────────────────────────────────────────────
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: `${SYSTEM_PROMPT}\n\n${fullContext}`,
      messages,
    })

    const reply = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as any).text)
      .join("")

    // ── Session speichern / updaten ───────────────────────────
    const updatedMessages = [...messages, { role: "assistant", content: reply }]
    let activeSessionId = sessionId

    if (sessionId) {
      await supabase.from("chat_sessions").update({
        messages: updatedMessages,
        message_count: updatedMessages.length,
        last_message_at: new Date().toISOString(),
      }).eq("id", sessionId).eq("user_id", userId)
    } else {
      const { data: newSession } = await supabase.from("chat_sessions").insert({
        user_id: userId,
        session_type: sessionType,
        linked_dream_id: linkedDreamId ?? null,
        linked_journal_id: linkedJournalId ?? null,
        messages: updatedMessages,
        message_count: updatedMessages.length,
        last_message_at: new Date().toISOString(),
      }).select("id").single()
      activeSessionId = newSession?.id
    }

    return NextResponse.json({ reply, sessionId: activeSessionId })

  } catch (error) {
    console.error("Chat-Fehler:", error)
    return NextResponse.json({ error: "Antwort konnte nicht generiert werden." }, { status: 500 })
  }
}