# MeinTraum – Projekt-Kontext

## Was ist MeinTraum?
Eine Web-App für Traumtagebuch, KI-gestützte Reflexion und Schlafoptimierung.
Live unter: https://www.meintraum.app

**Positionierung:** Kein Esoterik-Tool – sondern Traumtagebuch + persönliche Mustererkennung + reflektierende KI-Auswertung + Schlaf- und Gewohnheitszusammenhänge.

---

## Tech-Stack
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend/DB:** Supabase (Postgres)
- **Auth:** Supabase Magic Link
- **Deployment:** Vercel (Push via GitHub → automatisch live)
- **KI (geplant):** OpenAI API

---

## Projektstruktur
```
app/
  page.tsx               → Landingpage (Header wird hier ausgeblendet)
  layout.tsx             → Root Layout mit AppHeader
  AppHeader.tsx          → Sticky Header mit Auth-State (Login/Logout)
  dashboard/page.tsx     → Hauptübersicht (Traumstatistiken, Schnellzugriff)
  entry/page.tsx         → Neuen Traum erfassen
  dreams/page.tsx        → Traumarchiv (Liste aller Träume)
  dreams/[id]/page.tsx   → Einzelner Traum (Detail-Ansicht)
  login/page.tsx         → Magic Link Login
  auth/callback/route.ts → Supabase Auth Callback
  impressum/page.tsx     → Impressum
  datenschutz/page.tsx   → Datenschutz
lib/
  supabase.ts            → Supabase Client
```

---

## Supabase Datenbank
### Tabellen (aktuell)
**dream_entries**
- id, user_id, created_at
- raw_input_text (Freitext oder Stichworte)
- dominant_emotion (z.B. "Angst", "Freude")
- dream_clarity ("Sehr klar", "Mittel", "Verschwommen")
- familiar_person_flag (boolean)
- familiar_place_flag (boolean)
- nightmare_flag (boolean)
- dreamed_at (timestamp – wann war der Traum)

### Geplante Tabellen (noch nicht erstellt)
- **dream_entities** – erkannte/eingegebene Personen, Orte, Objekte, Emotionen
- **dream_analysis** – KI-Auswertungen pro Traum
- **sleep_checkins** – Schlafdauer, Qualität, Stress, Alkohol etc.

---

## Auth
- Magic Link via Supabase
- Redirect nach Login: https://www.meintraum.app/auth/callback
- AppHeader zeigt User-Email + Abmelden-Button wenn eingeloggt
- AppHeader zeigt Login-Button wenn ausgeloggt

---

## Design
- Dark Theme: Hintergrund `#070b14`
- Akzentfarbe: Cyan (`cyan-300`)
- Rundungen: `rounded-2xl` / `rounded-3xl`
- Glassmorphism: `bg-white/5 backdrop-blur border border-white/10`

---

## Aktueller Stand (März 2025)
- [x] Landingpage live
- [x] Magic Link Login funktioniert
- [x] Traum erfassen (entry/page.tsx) funktioniert
- [x] Dashboard mit Statistiken
- [x] Traumarchiv-Liste
- [x] Encoding-Bugs gefixt (Umlaute)
- [x] Auth-State im Header (Login/Logout sichtbar)

## Nächste Schritte (Priorität)
- [ ] Entitäten-System: Personen, Orte, Dinge beim Erfassen taggen
- [ ] dream_entities Tabelle in Supabase anlegen
- [ ] KI-Analyse einbauen (OpenAI API)
- [ ] Schlaf-Check-in Seite
- [ ] Route Protection: nicht eingeloggte User zu /login weiterleiten

---

## Wichtige Hinweise
- Keine absoluten KI-Aussagen – immer "könnte", "wird oft assoziiert mit"
- raw_input_text bleibt immer unverändert erhalten
- KI-Vorschläge müssen als Entwurf markiert sein
- Keine medizinischen/therapeutischen Aussagen
