import type { Metadata } from "next"
import TraumdeutungClient from "./client"

export const metadata: Metadata = {
  title: "Traumdeutung – Was bedeutet mein Traum? | MeinTraum",
  description:
    "Traum deuten mit KI – kostenlos, sofort, ohne Anmeldung. Gib deinen Traum ein und erhalte eine psychologische Analyse in Sekunden. Verstehe wiederkehrende Symbole und Muster.",
  keywords: [
    "Traumdeutung",
    "Traum deuten",
    "Was bedeutet mein Traum",
    "Traum analysieren",
    "Traumsymbole",
    "Träume verstehen",
    "Traum Bedeutung",
    "Traumdeutung kostenlos",
    "Traum Psychologie",
    "Albtraum deuten",
    "wiederkehrender Traum",
    "Traumanalyse",
  ],
  openGraph: {
    title: "Traumdeutung – Was bedeutet mein Traum?",
    description: "KI-gestützte Traumdeutung, kostenlos und sofort. Kein esoterischer Kitsch – psychologische Reflexion.",
    url: "https://www.meintraum.app/traumdeutung",
    siteName: "MeinTraum",
    locale: "de_CH",
    type: "website",
  },
  alternates: {
    canonical: "https://www.meintraum.app/traumdeutung",
  },
}

export default function TraumdeutungPage() {
  return <TraumdeutungClient />
}