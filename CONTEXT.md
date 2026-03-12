# MeinTraum – Projekt-Kontext & Roadmap
_Zuletzt aktualisiert: März 2026_

## Projekt
- **App:** Traumtagebuch + Journal mit KI-Reflexion, Mustererkennung, Schlafoptimierung
- **Live:** https://www.meintraum.app
- **Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Supabase + Vercel
- **Auth:** Supabase Magic Link → Redirect: https://www.meintraum.app/auth/callback
- **KI:** Anthropic Claude (claude-sonnet-4-20250514) via API
- **Nutzer:** Anfänger, arbeitet mit VS Code + GitHub + Vercel, copy-paste Workflow

## Projektstruktur
```
app/
  page.tsx                    → Landingpage
  layout.tsx                  → Root Layout mit AppHeader
  AppHeader.tsx               → Sticky Header mit Auth-State
  AuthBanner.tsx              → Gast-Banner
  dashboard/page.tsx          → Dashboard
  entry/page.tsx              → Traum erfassen (Schnellerfassung)
  dreams/page.tsx             → Traumarchiv Timeline
  dreams/[id]/page.tsx        → Detail + Bearbeiten + KI-Analyse
  journal/page.tsx            → Journal Timeline (NEU)
  journal/new/page.tsx        → Neuer Journal-/Stimmungseintrag (NEU)
  journal/[id]/page.tsx       → Journal Detail + Bearbeiten (NEU)
  timeline/page.tsx           → Kombinierte Timeline Träume + Journal (geplant)
  login/page.tsx              → Magic Link Login
  auth/callback/route.ts      → Auth Callback
  api/
    analyze-dream/route.ts    → KI Traumanalyse (4 Modi)
    expand-dream/route.ts     → Stichwörter → Traumtext
    analyze-journal/route.ts  → KI Journal-Reflexion (geplant)
    chat/route.ts             → KI-Chat (geplant)
lib/
  supabase.ts                 → Supabase Client
  useAuth.ts                  → Auth Hook
```

## Supabase Datenbank
```sql
dream_entries:        id, user_id, raw_input_text, dominant_emotion, dream_clarity,
                      dream_tone, familiar_person_flag, familiar_place_flag,
                      nightmare_flag, created_at, dreamed_at

journal_entries:      id, user_id, body_text, mood_score (1-10), mood_label,
                      energy_level (1-5), sleep_hours, tags (text[]),
                      created_at, entry_date

user_entities:        id, user_id, entity_type, entity_category, entity_label,
                      is_confirmed, created_at, updated_at

dream_entry_entities: id, dream_entry_id, user_entity_id, source, confidence, created_at

entity_presets:       id, entity_type, entity_category, entity_label, sort_order, created_at

dream_analysis:       id, dream_entry_id, mode, summary, themes (text[]),
                      emotions (text[]), caution_note, created_at

user_profile:         id, user_id, display_name, birth_year, context_notes,
                      created_at (geplant)

waitlist:             id, email, created_at
```

## Design-System
- Background: `#070b14`
- Akzent Träume: `cyan-300`
- Akzent Journal: `rose-300`
- Personen-Tags: `violet-300`
- Orts-Tags: `amber-300`
- Albtraum: `red-300`
- Schöner Traum: `emerald-300`
- Rundungen: `rounded-2xl` / `rounded-3xl`
- Glassmorphism: `bg-white/5 backdrop-blur border border-white/10`

## KI-Prompting Prinzipien
- Immer vorsichtige Sprache: "könnte", "wird oft assoziiert mit", "mögliche Deutung"
- Keine medizinischen/therapeutischen Diagnosen
- Keine absoluten Aussagen
- KI als Reflexionsangebot, nicht als Wahrheit

## ROADMAP

### ✅ FERTIG
- Schnellerfassung Traum + Post-Save Flow
- Traumarchiv Timeline mit Entities
- Detail-Seite: Bearbeiten, Entity-Picker (inline editierbar), Löschen
- Stichwörter → Traumtext via KI
- KI-Analyse in 4 Modi (Psychologisch, Poetisch, Humorvoll, Wissenschaftlich)
- Datum/Uhrzeit bearbeitbar
- AppHeader, AuthBanner, useAuth
- Supabase RLS, dream_analysis Tabelle

### 🔴 PHASE 1 – Kern stärken (JETZT)
- [ ] **Journal / Stimmungseintrag** ← AKTUELL
  - Felder: Freitext, Stimmungs-Score (1-10), Energie (1-5), Schlafstunden, Tags
  - Timeline mit Filter: Alles / Nur Träume / Nur Journal
  - Farbe: rose-300
  - KI-Reflexion optional

- [ ] **User-Profil / Kontext**
  - Optionale Fragen: Name, Alter, Lebenssituation, aktueller Stress
  - Wird KI als Hintergrundkontext mitgegeben

### 🟡 PHASE 2 – KI vertiefen
- [ ] **KI-Chat**
  - Chat-Interface auf Detail-Seite (Traum oder Journal)
  - KI als Reflexions-Partner, kein Life-Coach
  - Hilft unbewusste Mechanismen zu entdecken

- [ ] **Muster-Analyse**
  - Mehrere Träume + Journal-Einträge übergreifend
  - Kontext-Verknüpfung: "Kind startet Schule" → Träume der Folgewochen
  - Persönliches Traum- & Stimmungsprofil

### 🟢 PHASE 3 – Wachstum & Retention
- [ ] **Streak & Reminder** – stärkster Retention-Mechanismus
- [ ] **Wochenrückblick** – automatisch jeden Sonntag
- [ ] **Social Share-Cards**
  - Story-Cards für Instagram/WhatsApp
  - Streak-Karten, Muster-Infografiken
  - Virales Marketing das sich selbst finanziert
- [ ] **Gast-Modus** – localStorage → bei Anmeldung in Account übertragen
- [ ] **Personen-Vorschläge** aus bisheriger History
- [ ] **Bildgenerierung** – Traum als Bild (Flux)

## Wichtige technische Hinweise
- `dominant_emotion` kommagetrennt: "Angst, Freude"
- `dream_tone` ersetzt `nightmare_flag` langfristig
- `raw_input_text` bleibt immer unverändert
- Nach `.env.local` Änderungen → Dev-Server neu starten
- Nach Vercel Env-Var Änderungen → manuell Redeploy
- Magic Link lokal: Supabase → Auth → URL Config → `http://localhost:3000/auth/callback`
- API Keys niemals in Git pushen
