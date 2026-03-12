import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import AppHeader from "./AppHeader"
import FeedbackButton from "./FeedbackButton"
import "./globals.css"

export const metadata: Metadata = {
  title: "MeinTraum – Verstehe deine Träume und dich selbst",
  description:
    "Halte deine Träume in Sekunden fest und entdecke über Zeit Muster, Emotionen und Zusammenhänge zwischen Schlaf, Alltag und Unterbewusstsein.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "MeinTraum",
    description: "Träume festhalten, Muster erkennen, dich selbst besser verstehen.",
    url: "https://www.meintraum.app",
    siteName: "MeinTraum",
    locale: "de_CH",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className="bg-[#070b14] text-white">
        <AppHeader />
        {children}
        <FeedbackButton />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}