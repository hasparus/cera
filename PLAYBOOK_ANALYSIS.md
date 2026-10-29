# AI App Playbook: what it says and what it means for Cera

Source: [blakeandersonw/ai-app-playbook](https://github.com/blakeandersonw/ai-app-playbook), vendored as a submodule at `vendor/ai-app-playbook` (pinned to `b12a30a`, MIT). Read 2026-10-29.

```bash
git submodule update --init vendor/ai-app-playbook
```

## The playbook in one page

An `AGENTS.md`-driven guide that walks a coding agent and a founder through 15 phases, from picking a niche to the first profitable month. The author says they've scaled 5 apps past $100k MRR. The numbers in it are the author's estimates, not measured data, and the playbook says so.

**The thesis:** pick a frequent problem AI solves in seconds (Cal AI, Yuka, PictureThis), validate it with short-form video and a waitlist before building, charge about $30/year with a free trial, keep infra close to free, and spend your effort on onboarding, paywall, retention and distribution.

| Area               | Playbook's pick                                                                                                                                        | Chapter |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| Niche              | 7-criterion scorecard, build only at ≥ 25/35 with no 1s; one week of video + waitlist as the demand test                                               | 00      |
| Backend            | Cloudflare only: one Worker with a plain `fetch` handler, D1 with plain SQL, R2, KV, Queues                                                            | 02, 03  |
| Auth               | Better Auth in the Worker, anonymous first, Sign in with Apple                                                                                         | 04      |
| AI                 | DeepSeek via OpenRouter behind AI Gateway; models picked with Artificial Analysis plus your own evals; server-side quotas; every call logged with cost | 05      |
| Clients            | SwiftUI on iOS, React Native or Kotlin on Android, React + Vite on web                                                                                 | 06      |
| Money              | Superwall (mobile), Stripe (web), one `entitlements` table written only by webhooks; $30/yr + 3–7 day trial; hard paywall after the aha moment         | 07      |
| Analytics + errors | Everything into Tinybird through `POST /events`                                                                                                        | 08      |
| UX                 | Copy flows from category leaders; Cal AI/Duolingo onboarding (questions → "building your plan" → personal result → paywall)                            | 09      |
| Retention          | Ask for push after the first win, streaks with a freeze, widgets, trial-ending reminder                                                                | 10      |
| Distribution       | Short-form video first, paid UGC creators, DMs to niche pages, ASO, share cards                                                                        | 11      |
| Costs              | 30% of downloads start a trial × 30% pay × $30 ≈ $2.70 per download; infra + AI ≈ 2.5% of revenue                                                      | 12      |
| Compliance         | Spend caps, account deletion, Restore Purchases, privacy labels, no health claims, minors                                                              | 13      |

**Banned outright:** Vercel, Netlify, Firebase, Supabase, Clerk, Auth0, Sentry, PostHog, Next.js, Hono, ORMs.

## Where Cera stands against it

### Stack: conflicts everywhere, and that's fine

Almost every Cera decision is on the playbook's "do not use" list or outside its stack: Expo/React Native on iOS (the playbook wants SwiftUI), Convex (same category as the banned Firebase and Supabase), Vercel for the landing, and Sentry and RevenueCat in `PLAN.md`.

**Recommendation: don't migrate.** The playbook optimizes the cost of an AI-heavy, server-centric app at 100k+ MAU. Its cost table assumes 60 AI calls per user per month. Cera is local-first and its core loop (check off the routine) makes no server calls at all. At Cera's scale the Convex and Vercel free tiers cost $0, and rewriting in SwiftUI plus a Worker would burn months of runway to save nothing. Record that in `PLAN.md` so the question stays closed.

Two places where the playbook's reasoning still holds inside the current stack:

- **Errors:** keep Sentry. Tinybird can't symbolicate React Native native crashes, and the playbook's "errors in the same pipeline" answer is aimed at a Worker plus SwiftUI app. Do turn on App Store Connect and Play crash reports too.
- **Landing hosting:** `www/` is a static Astro build, so Vercel, Cloudflare and EAS Hosting are all free and interchangeable. Pick whichever DNS is already on and move on.

### Scorecard: Cera is borderline, and the weak spot is "AI is the engine"

My scores below are a first pass for Rouzeris to redo:

| #   | Criterion          | Score | Why                                                                                                                         |
| --- | ------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | Pain or desire     | 3     | People track routines in Notes and spreadsheets and keep re-buying expired products. It's real, but it's friction, not pain |
| 2   | Frequency          | **5** | Twice a day, every day. This is Cera's strongest card                                                                       |
| 3   | Demoability        | 3     | A calendar is harder to show in 3 seconds than "photo → score"                                                              |
| 4   | AI is the engine   | **2** | Today Cera is scheduling + CRUD; the assistant (#6) is a garnish                                                            |
| 5   | Willingness to pay | 3     | Skincare spend is high; routine-tracker users expect free; PL/UA prices sit below $30/yr                                    |
| 6   | Reachable audience | **5** | Skincare TikTok/Reels is huge, and PL/UA is a smaller pond where an EN-first leader barely competes                         |
| 7   | Low risk           | 4     | Skin is health-adjacent, but `PRODUCT.md` already rules out medical claims                                                  |

**Total ≈ 25/35, with a 2 on criterion 4.** By the playbook's own gate that's "barely build". You can read it two ways:

1. **Cera isn't an AI app, and that's OK.** The scorecard was built for AI-first products. Cera's bet is ritual and retention, which the playbook covers well in chapters 09–11. Skip criterion 4 and take everything else.
2. **Give Cera an AI engine that fits the product.** The pieces already exist: the Open Beauty Facts catalog (#26) has barcodes and ingredient lists, and `constants/ingredients.ts` already detects conflicts, though only from product _names_. "Scan your shelf → Cera builds your AM/PM routine and flags retinol + AHA on the same night" is the Yuka/Cal AI scan-to-result pattern applied to Cera's real job. It's also a 3-second video hook. That lifts criteria 3 and 4 without changing what Cera is.

I lean to (2) as a direction for the first version after launch, not as a launch blocker.

### What to take, chapter by chapter

| Chapter         | Take for Cera                                                                                                                                                                                                                                                                | Skip                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 00 Niche        | The one-week demand test (videos + waitlist ≥ 10% of visitors). The landing and Convex waitlist already exist                                                                                                                                                                | Re-picking a niche                                                                                                           |
| 05 AI           | For the assistant (#6): server-side per-user quota, every call logged with cost, prompts in git, a timeout + fallback model, an eval set of 20+ real questions that includes the red-flag "see a doctor" cases. Pick the model by evals; for skin advice, safety beats price | DeepSeek as a default without checking data residency; route only to zero-data-retention providers (the playbook's own rule) |
| 07 Money        | Settle the monetization question with the chapter 12 math. If it's a subscription: yearly first, a trial with a reminder, prices localized per storefront (PL/UA well below $30), Restore Purchases. Superwall has a React Native SDK if RevenueCat stays parked             | Hard paywall before the routine works; local-first users should never lose their ritual to a paywall                         |
| 08 Analytics    | A small event schema, fixed now (below). Measure the funnel and D1/D7/D30                                                                                                                                                                                                    | Tinybird specifically; the vendor matters less than the schema                                                               |
| 09 Design & UX  | Onboarding moves up from "post-launch": skin type/concerns questions → "building your routine" → personal AM/PM plan (the aha) → first check-off within 60 s. One reference app per screen                                                                                   | —                                                                                                                            |
| 10 Retention    | Ask for notifications _after_ the first completed routine, at the user's own AM/PM time; PAO-expiry nudges (already planned); a streak with a freeze; a home-screen widget later                                                                                             | Lifecycle email before auth exists                                                                                           |
| 11 Distribution | The vertical-video rail already planned in `LANDING_NOTES.md`; weekly-recap share cards (9:16); PL/UA/EN ASO, where PL/UA keywords are cheap                                                                                                                                 | Paid UGC until organic shows signal                                                                                          |
| 13 Compliance   | **Minors:** skincare TikTok skews young ("Sephora kids"), so read the COPPA/age-assurance rules before launch. Account deletion once Convex Auth lands; Sign in with Apple if Google is offered; accurate privacy labels                                                     | —                                                                                                                            |

### One gap to fix first: Cera can't measure the demand test today

`legal/privacy-policy.md` says "We do not use analytics or tracking services", so there's no way to compute visitors → waitlist, which is the playbook's main Phase 0 signal. The fix is small: a cookieless page-view count (a Convex HTTP counter or a cookieless hosted tool) plus one honest line in the privacy policy. That's a prerequisite for step 2 below.

## Next steps for Rouzeris

In order. Each one ends in a decision or a number.

1. **Redo the scorecard yourself** (15 min). Pick reading 1 or 2 above and write it in `PLAN.md` → Decisions, along with "evaluated the playbook stack, staying on Expo + Convex because local-first and no per-call AI".
2. **Run the one-week demand test** with what already exists: add cookieless visitor counting and update the privacy policy, then post 10–15 vertical videos (a real evening routine beats AI UGC, as `LANDING_NOTES.md` already says) and track waitlist sign-ups / visitors. The playbook's bar: saves, shares, "what app is this?" comments, ≥ 10%.
3. **Close the "Monetization" open question** with chapter 12 math at PL/UA prices. If the answer is a subscription, onboarding and the paywall become launch-blocking, so move them out of "post-launch" in the roadmap.
4. **Fix the event schema now**, before any vendor: `app_opened`, `onboarding_step`, `onboarding_completed`, `product_added {source: manual|catalog|scan}`, `routine_item_checked {slot: am|pm}` (the core action), `routine_completed {slot}`, `notification_opted_in`, `paywall_viewed`, `error`. North-star metric: **share of users who complete both AM and PM routines on day 7**.
5. **Retention before features:** local notifications at the user's routine times, asked after the first completed routine; PAO-expiry nudges; a streak with a freeze.
6. **Before building the assistant (#6),** write 20+ eval questions (including the red-flag escalations) and set the per-user quota. The chapter 05 discipline is worth more than its model picks.
7. **Spike "scan → routine"** (barcode → OBF catalog → ingredients → conflict check) once #26 lands. It's both the AI engine the scorecard asks for and the 3-second demo for chapter 11.
8. **Pre-launch compliance pass** with the chapter 13 table, plus an explicit stance on users under 16.

## Caveats on the source

- It's a single-commit repo and partly promotional (follow/star asks, a hiring link). Treat the benchmarks (30% trial start, 30% trial → paid) as an optimistic ceiling, not a forecast.
- Prices and model ids are dated Oct 26, 2026 and will drift; the playbook itself says to re-check them.
- Its stack bans are opinions tuned for an AI-heavy, iOS-first, solo-founder app. Cera matches the solo founder and mobile-first parts, not the AI-heavy part.
