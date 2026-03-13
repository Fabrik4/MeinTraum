import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const { entry_id, entry_type, user_id, text, expanded } = await req.json()
    if (!entry_id || !user_id || !text?.trim()) {
      return NextResponse.json({ error: "entry_id, user_id und text sind erforderlich" }, { status: 400 })
    }

    const supabase = getSupabase()
    const idCol = entry_type === "journal" ? "journal_entry_id" : "dream_entry_id"
    const { data, error } = await supabase
      .from("dream_revisions")
      .insert({
        [idCol]: entry_id,
        user_id,
        text: text.trim(),
        expanded: expanded?.trim() || null,
      })
      .select("id, text, expanded, created_at")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, revision: data })
  } catch (err) {
    console.error("add-revision Fehler:", err)
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 })
  }
}
