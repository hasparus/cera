# Cera — Plan

## Current state (2026-07-03)

**Stack:** Expo 54, React Native 0.81, Tamagui, TypeScript, Bun. i18n: PL/UA/EN (#8 merged).
**Architecture:** local-first — AsyncStorage is the source of truth, no backend yet.

Works: 14-day calendar with morning/evening routine tracking, product shelf with
PAO/expiry, add-product flow (daily / specific days / interval), themes,
iOS + Android + Web, 11 Playwright e2e tests (web).

In flight: **PR #10** — flatten `expo/` into repo root, prettier, hk pre-commit
hooks, mise.toml, GitHub Actions CI (closes #9).

## Decisions

- **Backend: Convex.** Auth, backup/sync, shared product archive, assistant
  actions. Picked for velocity + end-to-end TS types; scheduled functions later
  cover "product expires soon" notifications; self-hostable if we outgrow it.
- **Local-first stays.** Convex is backup + shared data + server-side secrets,
  not the source of truth for "did I do my evening routine". App must work offline.
- **Web hosting: Vercel** (static export), privacy/terms on the same domain.
- **Stack stays Expo + Convex** (2026-10-29). Evaluated the ai-app-playbook
  stack (SwiftUI + Cloudflare Workers/D1, see `PLAYBOOK_ANALYSIS.md`) and
  passed: Cera is local-first with no per-call AI in its core loop, so a
  rewrite would cost months and save nothing at our scale.

## Roadmap

### 1. Domain & identity — blocks store submission and legal

- [x] Buy domain (#1): **cera.love** (bought 2026-07-03)
- [ ] Rebrand identifiers **before first store upload** (irreversible after):
      `app.json` `scheme`, `ios.bundleIdentifier`, `android.package`,
      market URL in `app/(tabs)/settings/index.tsx`, README
- [x] Landing page built (`www/` — Astro + React, PL/UA/EN, waitlist form,
      `/privacy` + `/terms` rendered from `legal/*.md`)
- [ ] Deploy landing to Vercel; set `PUBLIC_WAITLIST_URL` (Convex HTTP action)
      to activate the waitlist form

### 2. Backend foundation (Convex)

- [ ] Convex project + schema, wire client into Expo
- [ ] Logowanie (#3) — Convex Auth
- [ ] Backup/sync of products + routines (opportunistic, local-first preserved)

### 3. Features

- [ ] Porady (#5) — static tips screen; no backend needed, can ship anytime
- [ ] Archiwum (#4) — shared product DB with user submissions in Convex;
      needs a moderation story before opening submissions
- [ ] Asystent (#6) — Convex action → Claude, streaming. API key server-side
      only. System prompt: harmless advice only + red-flag symptom list that
      escalates to "see a doctor"

### 4. App Store

- [ ] Settings completion: support/contact, rate-the-app, JSON export/import,
      delete-all-data with confirmation
- [ ] `app.json`: buildNumber, versionCode, `ITSAppUsesNonExemptEncryption: false`,
      privacy policy + support URLs
- [ ] EAS build profiles (development + production), TestFlight beta
- [ ] App Store Connect listing: name, subtitle, description, keywords, screenshots

### 5. Hardening & polish (post-launch OK)

- [ ] Sentry error tracking
- [ ] Accessibility audit (VoiceOver/TalkBack, text sizes, contrast)
- [ ] Onboarding flow for new users
- [ ] Streaks / weekly insights

### Parked

- Monetization (RevenueCat) — undecided; re-add only if monetizing
- Vitest unit tests — add when pure logic (frequency/PAO calc) grows past e2e coverage
- OCR ze zdjęcia przy dodawaniu produktu — świadomie później
- Analytics — decide vendor when there are users to measure

## TODO — cleanup po migracji z Rork (2026-05-31)

- [ ] Rebranding identyfikatorów — patrz Roadmap 1 (świadomie nieruszane do decyzji o domenie)
- [ ] `bun test` odpala test runner Buna zamiast Playwrighta — CI używa
      `bun run test`; ewentualnie przemianować skrypt na `test:e2e`
- [ ] Deprecated `ImagePicker.MediaTypeOptions` → `ImagePicker.MediaType` (warn przy starcie)

## Open questions

- Monetization: free forever vs subscription (determines RevenueCat return)
- Archiwum moderation: who approves user-submitted products?
