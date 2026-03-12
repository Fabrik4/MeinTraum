import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { type, user_id } = await req.json()

  if (!user_id || !["no_memory", "no_sleep"].includes(type)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const today = new Date().toISOString().slice(0, 10)

  const { error } = await supabase.from("dream_entries").insert({
    user_id,
    raw_input_text: type === "no_memory" ? "Kein Traum erinnerbar" : "Nicht geschlafen",
    dream_tone: type,
    dreamed_at: new Date(today + "T06:00:00Z").toISOString(),
    nightmare_flag: false,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
