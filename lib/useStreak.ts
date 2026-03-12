import { useEffect, useState } from "react"
import { supabase } from "./supabase"

export function useStreak(userId: string | null) {
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!userId) { setLoading(false); return }
    const { data } = await supabase.rpc("get_user_streak", { p_user_id: userId })
    setStreak(data ?? 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [userId])

  return { streak, loading, reload: load }
}
