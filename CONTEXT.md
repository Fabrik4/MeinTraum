# MeinTraum – Entwicklungs-Session Zusammenfassung
## Stand: 12. März 2026 (Session 4)

## Projekt-Kontext
- **App:** Traumtagebuch + Journal mit KI-Reflexion, Mustererkennung, Schlafoptimierung
- **Live:** https://www.meintraum.app
- **Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Supabase + Vercel
- **Auth:** Supabase Magic Link → Redirect: https://www.meintraum.app/auth/callback
- **KI:** Anthropic Claude (claude-sonnet-4-20250514) via API
- **Nutzer:** Anfänger, arbeitet mit VS Code + GitHub + Vercel, copy-paste Workflow

---

## Aktuelle App-Struktur (vollständig)

```
app/
  page.tsx                        → Landingpage
  layout.tsx                      → Root Layout mit AppHeader
  AppHeader.tsx                   → Mobile Bottom Bar + Desktop Top Nav ✅
  DreamChat.tsx                   → Traumbegleiter AI Chat-Komponente ✅
  dashboard/page.tsx              → Dashboard (Stats + Quick-Add + letzter Eintrag) ✅
  entry/page.tsx                  → Traum erfassen → redirect zu /entries/[id]?type=dream ✅
  entries/[id]/page.tsx           → Universal-Detailseite (Traum + Journal) ✅
  journal/new/page.tsx            → Neuer Journal-Eintrag ✅
  timeline/page.tsx               → Kombinierte Timeline ✅
  profile/page.tsx                → Profil + KI-Kontext + Keyevents + KI-Gedächtnis ✅
  chat/page.tsx                   → Traumbegleiter AI freier Chat ✅
  login/page.tsx                  → Magic Link Login
  auth/callback/route.ts          → Auth Callback
  datenschutz/page.tsx            → Datenschutz
  impressum/page.tsx              → Impressum
  dreams/[id]/page.tsx            → Redirect → /entries/[id]?type=dream ✅
  dreams/page.tsx                 → Redirect → /timeline ✅
  journal/[id]/page.tsx           → Redirect → /entries/[id]?type=journal ✅
  api/
    analyze-dream/route.ts        → KI Traumanalyse (4 Modi)
    analyze-journal/route.ts      → KI Journal-Analyse (4 Modi) ✅
    expand-dream/route.ts         → Stichwörter → Traumtext
    expand-journal/route.ts       → Stichwörter → Journaltext ✅
    chat/route.ts                 → Traumbegleiter AI Chat (Zwei-Stufen-Kontext) ✅
    generate-summary/route.ts     → KI-Gedächtnis generieren ✅
lib/
  contextBuilder.ts               → Zwei-Stufen-Kontext Helper ✅ NEU
  supabase.ts                     → Supabase Client
  useAuth.ts                      → Auth Hook
```

---

## Supabase Datenbank (vollständig)

```sql
-- Bestehend
dream_entries:        id, user_id, raw_input_text, dominant_emotion, dream_clarity,
                      dream_tone, familiar_person_flag, familiar_place_flag,
                      nightmare_flag, is_key_event (bool), created_at, dreamed_at

journal_entries:      id, user_id, body_text, mood_score (1-10), mood_label,
                      energy_level (1-5), sleep_hours, tags (text[]),
                      dominant_emotion, familiar_person_flag, familiar_place_flag,
                      is_key_event (bool), entry_date, created_at

journal_entry_entities, journal_analysis, dream_entry_entities, dream_analysis
user_entities, entity_presets, waitlist

-- NEU (context_system_migration.sql)
user_profiles:        id, display_name, age, interests, ki_context,
                      created_at, updated_at

key_events:           id, user_id, title, description, event_date, emoji,
                      linked_dream_id, linked_journal_id, created_at

user_summaries:       id, user_id, summary_text, recurring_persons[], recurring_places[],
                      recurring_emotions[], mood_avg_7d, mood_avg_30d, mood_avg_90d,
                      total_dreams, total_journal, covers_from, covers_to, generated_at

chat_sessions:        id, user_id, session_type (free/dream/journal),
                      linked_dream_id, linked_journal_id, messages (jsonb),
                      compressed_summary, message_count, last_message_at, created_at
```

## SQL-Migrationen (alle ausgeführt ✅)
- `dream_analysis_migration.sql`
- `journal_entries_migration.sql`
- `journal_extension_migration.sql`
- `user_profiles_migration.sql`
- `context_system_migration.sql` ← NEU

---

## Design-System
- Background: `#070b14`
- Akzent Träume: `cyan-300`
- Akzent Journal: `amber-300` ← war rose, jetzt amber/gold
- Chat/Violet: `violet-300`
- Personen-Tags: `violet-300/15`
- Orts-Tags: `amber-300/15`
- Albtraum: `red-300` (sanft)
- Schöner Traum: `emerald-300` (sanft)
- Stimmung: 1-4 `rose-300/80`, 5-6 `amber-300/80`, 7-10 `emerald-300/80`
- Rundungen: `rounded-2xl` / `rounded-3xl`
- Glassmorphism: `bg-white/5 backdrop-blur border border-white/10`

---

## Zwei-Stufen-Kontext System (NEU)

```
STUFE 1 – Dauerkontex (~850 Token, immer mitgeschickt)
  • Profil: Name, Alter, Interessen, KI-Kontext
  • user_summaries: KI-generierte Zusammenfassung aller Einträge (manuell aktualisierbar)
  • Stimmungstrends: Ø 7d / 30d / 90d
  • Wiederkehrende Personen, Orte, Emotionen
  • Keyereignisse (max. 10, nach Datum)
  • Gesamtanzahl Träume + Journaleinträge

STUFE 2 – Dynamisch (~850 Token, je nach Kontext)
  • Aktueller Eintrag (Text + Metadaten)
  • Letzte 5 Einträge gemischt (Kurzversion)
  • Chatverlauf (aus chat_sessions)

Kosten: ~$0.01 pro Chat-Nachricht, ~$0.025 pro KI-Gedächtnis-Generierung
Break-even: ~150 zahlende User @ 9 CHF/Mo
```

## Traumbegleiter AI (Chat)
- Name überall: **"Traumbegleiter AI"** (war: "KI-Gespräch")
- Freier Chat: `/chat` → `chat/page.tsx`
- Entry-Chat: `DreamChat.tsx` Komponente auf Detailseite
- Chatverläufe persistent in `chat_sessions` gespeichert
- Session wird beim erneuten Öffnen desselben Eintrags wiederhergestellt

---

## Outputs (alle unter /mnt/user-data/outputs/)

| Datei | Ziel |
|---|---|
| `AppHeader.tsx` | `app/AppHeader.tsx` |
| `DreamChat.tsx` | `app/DreamChat.tsx` |
| `entries_detail_page.tsx` | `app/entries/[id]/page.tsx` |
| `entry_page.tsx` | `app/entry/page.tsx` |
| `journal_new_page.tsx` | `app/journal/new/page.tsx` |
| `timeline_page.tsx` | `app/timeline/page.tsx` |
| `chat_page.tsx` | `app/chat/page.tsx` |
| `dashboard_page.tsx` | `app/dashboard/page.tsx` |
| `profile_page.tsx` | `app/profile/page.tsx` |
| `chat-route.ts` | `app/api/chat/route.ts` |
| `analyze-journal-route.ts` | `app/api/analyze-journal/route.ts` |
| `expand-journal-route.ts` | `app/api/expand-journal/route.ts` |
| `generate-summary-route.ts` | `app/api/generate-summary/route.ts` |
| `contextBuilder.ts` | `lib/contextBuilder.ts` |
| `dreams_id_redirect.tsx` | `app/dreams/[id]/page.tsx` |
| `dreams_redirect.tsx` | `app/dreams/page.tsx` |
| `journal_id_redirect.tsx` | `app/journal/[id]/page.tsx` |
| `context_system_migration.sql` | Supabase SQL Editor |
| `user_profiles_migration.sql` | Supabase SQL Editor |
| `journal_entries_migration.sql` | Supabase SQL Editor |
| `journal_extension_migration.sql` | Supabase SQL Editor |

---

## Wichtige Env-Variablen (lokal + Vercel!)
```
NEXT_PUBLIC_SUPABASE_URL        → Supabase Projekt URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   → Supabase anon Key
SUPABASE_SERVICE_ROLE_KEY       → Supabase service_role Key ← NUR server-seitig!
ANTHROPIC_API_KEY               → Anthropic API Key
```
⚠️ Nach Vercel Env-Var Änderungen → manuell Redeploy auslösen!

---

## Bekannte Issues / Offene Punkte
- `SUPABASE_SERVICE_ROLE_KEY` fehlte in Vercel → behoben (user hat es eingetragen)
- Vercel Analytics/Speed Insights werden von Adblockern blockiert → harmlos, ignorieren
- `contextBuilder.ts` muss in `lib/` liegen (nicht `app/`)

---

## Nächste Schritte (Priorität)

### 🟡 Kurzfristig
1. **Testen** ob Chat nach Vercel-Fix funktioniert
2. **Timeline Pin-Icon** – Keyevent direkt aus Timeline pinnen (📌 neben Eintrag)
3. **entries_detail_page** updaten: DreamChat Props anpassen (dreamId/journalId mitgeben)

### 🟠 Mittelfristig
4. **Muster-Analyse** über mehrere Einträge (USP) – eigene Seite oder Dashboard-Widget
5. **Streak & Reminder** – Push-Notifications oder Email
6. **Wochenrückblick** – automatisch Sonntag generiert
7. **Monetarisierung** – Free Trial (14 Tage) → Plus 9 CHF / Pro 19 CHF

### 🔵 Langfristig
8. **Social Share-Cards** (virales Marketing)
9. **Gast-Modus** (localStorage → bei Anmeldung übertragen)
10. **Bildgenerierung** (Flux) für Träume
11. **Embeddings/pgvector** für semantische Suche (wenn >5k User)

---

## Wichtige Hinweise
- `dominant_emotion` kommagetrennt: "Angst, Freude"
- `dream_tone` ersetzt `nightmare_flag` langfristig, beide parallel
- `raw_input_text` bleibt immer unverändert
- Magic Link lokal: Supabase → Auth → URL Config → `http://localhost:3000/auth/callback`
- Nach `.env.local` Änderungen → Dev-Server neu starten
- KI-Aussagen immer mit "könnte", "wird oft assoziiert mit" formulieren
- Keine medizinischen/therapeutischen Aussagen
- `@anthropic-ai/sdk` ist in package.json ✅