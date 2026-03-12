import { createClient } from "@supabase/supabase-js"

// Server-seitiger Supabase Client (für API Routes)
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type TierOneContext = {
  profile: {
    displayName: string | null
    age: number | null
    interests: string | null
    kiContext: string | null
  }
  summary: string | null
  moodTrends: {
    avg7d: number | null
    avg30d: number | null
    avg90d: number | null
  }
  recurringPatterns: {
    persons: string[]
    places: string[]
    emotions: string[]
  }
  keyEvents: Array<{
    emoji: string
    title: string
    description: string | null
    date: string
  }>
  totals: {
    dreams: number
    journal: number
  }
}

export type TierTwoContext = {
  currentEntry: string | null
  recentEntries: Array<{
    type: "dream" | "journal"
    date: string
    snippet: string
    mood?: number | null
  }>
}

// ── Stufe 1: Dauerhafter Nutzerkontext ────────────────────────
export async function buildTierOneContext(userId: string): Promise<TierOneContext> {
  const supabase = getSupabase()

  const [profileRes, summaryRes, keyEventsRes, recentMoodRes] = await Promise.all([
    supabase.from("user_profiles")
      .select("display_name, age, interests, ki_context")
      .eq("id", userId).maybeSingle(),

    supabase.from("user_summaries")
      .select("summary_text, recurring_persons, recurring_places, recurring_emotions, mood_avg_7d, mood_avg_30d, mood_avg_90d, total_dreams, total_journal")
      .eq("user_id", userId)
      .order("generated_at", { ascending: false })
      .limit(1).maybeSingle(),

    supabase.from("key_events")
      .select("emoji, title, description, event_date")
      .eq("user_id", userId)
      .order("event_date", { ascending: false })
      .limit(15),

    // Stimmung direkt aus DB falls noch keine Summary existiert
    supabase.from("journal_entries")
      .select("mood_score, created_at")
      .eq("user_id", userId)
      .not("mood_score", "is", null)
      .order("created_at", { ascending: false })
      .limit(90),
  ])

  // Mood-Trends berechnen falls keine Summary vorhanden
  let avg7d: number | null = summaryRes.data?.mood_avg_7d ?? null
  let avg30d: number | null = summaryRes.data?.mood_avg_30d ?? null
  let avg90d: number | null = summaryRes.data?.mood_avg_90d ?? null

  if (!summaryRes.data && recentMoodRes.data?.length) {
    const now = Date.now()
    const entries = recentMoodRes.data
    const avg = (days: number) => {
      const cutoff = now - days * 864e5
      const filtered = entries.filter((e: any) => new Date(e.created_at).getTime() > cutoff)
      if (!filtered.length) return null
      return Math.round(filtered.reduce((s: number, e: any) => s + e.mood_score, 0) / filtered.length * 10) / 10
    }
    avg7d = avg(7); avg30d = avg(30); avg90d = avg(90)
  }

  return {
    profile: {
      displayName: profileRes.data?.display_name ?? null,
      age: profileRes.data?.age ?? null,
      interests: profileRes.data?.interests ?? null,
      kiContext: profileRes.data?.ki_context ?? null,
    },
    summary: summaryRes.data?.summary_text ?? null,
    moodTrends: { avg7d, avg30d, avg90d },
    recurringPatterns: {
      persons: summaryRes.data?.recurring_persons ?? [],
      places:  summaryRes.data?.recurring_places ?? [],
      emotions: summaryRes.data?.recurring_emotions ?? [],
    },
    keyEvents: (keyEventsRes.data ?? []).map((e: any) => ({
      emoji: e.emoji,
      title: e.title,
      description: e.description,
      date: e.event_date,
    })),
    totals: {
      dreams: summaryRes.data?.total_dreams ?? 0,
      journal: summaryRes.data?.total_journal ?? 0,
    },
  }
}

// ── Stufe 2: Dynamischer Eintragskontext ──────────────────────
export async function buildTierTwoContext(
  userId: string,
  options: {
    currentDreamId?: number
    currentJournalId?: number
  } = {}
): Promise<TierTwoContext> {
  const supabase = getSupabase()

  const [recentDreamsRes, recentJournalRes] = await Promise.all([
    supabase.from("dream_entries")
      .select("id, raw_input_text, dominant_emotion, dreamed_at, created_at")
      .eq("user_id", userId)
      .neq("id", options.currentDreamId ?? -1)
      .order("created_at", { ascending: false })
      .limit(4),

    supabase.from("journal_entries")
      .select("id, body_text, mood_score, entry_date, created_at")
      .eq("user_id", userId)
      .neq("id", options.currentJournalId ?? -1)
      .order("created_at", { ascending: false })
      .limit(4),
  ])

  // Letzte 5 Einträge gemischt, nach Datum sortiert
  const combined = [
    ...(recentDreamsRes.data ?? []).map((d: any) => ({
      type: "dream" as const,
      date: d.dreamed_at || d.created_at,
      snippet: d.raw_input_text?.slice(0, 120) + (d.raw_input_text?.length > 120 ? "…" : ""),
      mood: null,
    })),
    ...(recentJournalRes.data ?? []).map((j: any) => ({
      type: "journal" as const,
      date: j.entry_date || j.created_at,
      snippet: j.body_text?.slice(0, 120) + (j.body_text?.length > 120 ? "…" : ""),
      mood: j.mood_score,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  return {
    currentEntry: null, // wird vom Aufrufer gesetzt
    recentEntries: combined,
  }
}

// ── Kontext zu String zusammenbauen ──────────────────────────
export function formatContextForAI(
  tier1: TierOneContext,
  tier2: TierTwoContext,
  currentEntryText?: string
): string {
  const parts: string[] = []

  // STUFE 1
  parts.push("=== NUTZERKONTEXT ===")

  // Profil
  const profileParts: string[] = []
  if (tier1.profile.displayName) profileParts.push(`Name: ${tier1.profile.displayName}`)
  if (tier1.profile.age) profileParts.push(`Alter: ${tier1.profile.age}`)
  if (tier1.profile.interests) profileParts.push(`Über den User: ${tier1.profile.interests}`)
  if (tier1.profile.kiContext) profileParts.push(`Wichtig zu wissen: ${tier1.profile.kiContext}`)
  if (profileParts.length) parts.push(profileParts.join(" | "))

  // Zusammenfassung
  if (tier1.summary) {
    parts.push(`\nLebensgeschichte & Muster:\n${tier1.summary}`)
  }

  // Stimmungstrends
  const trends: string[] = []
  if (tier1.moodTrends.avg7d) trends.push(`7 Tage: ${tier1.moodTrends.avg7d}/10`)
  if (tier1.moodTrends.avg30d) trends.push(`30 Tage: ${tier1.moodTrends.avg30d}/10`)
  if (tier1.moodTrends.avg90d) trends.push(`90 Tage: ${tier1.moodTrends.avg90d}/10`)
  if (trends.length) parts.push(`Ø Stimmung – ${trends.join(" | ")}`)

  // Wiederkehrende Muster
  if (tier1.recurringPatterns.persons.length)
    parts.push(`Wiederkehrende Personen: ${tier1.recurringPatterns.persons.slice(0, 8).join(", ")}`)
  if (tier1.recurringPatterns.places.length)
    parts.push(`Wiederkehrende Orte: ${tier1.recurringPatterns.places.slice(0, 8).join(", ")}`)
  if (tier1.recurringPatterns.emotions.length)
    parts.push(`Häufige Emotionen: ${tier1.recurringPatterns.emotions.slice(0, 6).join(", ")}`)

  // Keyevents
  if (tier1.keyEvents.length) {
    parts.push(`\nSchlüsselereignisse:`)
    tier1.keyEvents.slice(0, 10).forEach((e) => {
      const desc = e.description ? ` – ${e.description}` : ""
      parts.push(`  ${e.emoji} ${e.title}${desc} (${e.date})`)
    })
  }

  // Gesamtanzahl
  if (tier1.totals.dreams || tier1.totals.journal) {
    parts.push(`\nArchiv: ${tier1.totals.dreams} Träume, ${tier1.totals.journal} Journaleinträge`)
  }

  // STUFE 2
  if (currentEntryText || tier2.recentEntries.length) {
    parts.push("\n=== AKTUELLER KONTEXT ===")
  }

  if (currentEntryText) {
    parts.push(`Aktueller Eintrag:\n${currentEntryText}`)
  }

  if (tier2.recentEntries.length) {
    parts.push("Letzte Einträge:")
    tier2.recentEntries.forEach((e) => {
      const date = new Date(e.date).toLocaleDateString("de-CH", { day: "numeric", month: "short" })
      const type = e.type === "dream" ? "🌙" : "📓"
      const mood = e.mood ? ` (Stimmung ${e.mood}/10)` : ""
      parts.push(`  ${type} ${date}${mood}: ${e.snippet}`)
    })
  }

  return parts.join("\n")
}

// ── Token-Schätzung ───────────────────────────────────────────
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}