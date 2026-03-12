"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DemoRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/#demo")
  }, [])
  return (
    <main className="min-h-screen bg-[#070b14] flex items-center justify-center">
      <p className="text-3xl animate-pulse">🌙</p>
    </main>
  )
}