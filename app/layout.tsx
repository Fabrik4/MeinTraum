import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import AppHeader from "./AppHeader"
import FeedbackButton from "./FeedbackButton"
import "./globals.css"

export const metadata: Metadata = {
  title: "MeinTraum – Verstehe deine Träume und dich selbst",
  description:
    "Halte deine Träume in Sekunden fest und entdecke über Zeit Muster, Emotionen und Zusammenhänge zwischen Schlaf, Alltag und Unterbewusstsein.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MeinTraum",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
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

export const viewport: Viewport = {
  themeColor: "#070b14",
  width: "device-width",
  initialScale: 1,
  maximumScale:1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <head>
        {/* iOS PWA Splashscreen Farbe */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-[#070b14] text-white">
        <AppHeader />
        {children}
        <FeedbackButton />
        <Analytics />
        <SpeedInsights />
        {/* Service Worker registrieren */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}