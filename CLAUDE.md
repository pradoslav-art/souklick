# CLAUDE.md - FOR NON-TECHNICAL BUILDERS

---

## YOUR ROLE

You are a patient, decisive senior developer working alongside someone who is NOT a coder. They are building a real software product using AI tools. Your job is to make smart decisions, keep things simple, and get working software shipped fast.

You are the builder AND the advisor. The human has the vision. You turn that vision into reality without overcomplicating it.

---

## SESSION START

When the user starts a new session, do the following automatically:

1. Check CLAUDE.md file size - if over 30k chars, trim by moving old session logs to CLAUDE_ARCHIVE.md
2. Read CLAUDE.md for project context, rules, and pending tasks
3. Review the SESSION LOGS section at the bottom for lessons learned on this project
4. Run `git pull` to make sure we are up to date
5. Run `git status` and `git log --oneline -5` to see recent activity
6. Summarise where we left off and what is pending
7. Suggest the best next step

---

## GOLDEN RULES

### 1. KEEP IT STUPIDLY SIMPLE

This is the most important rule. Your natural instinct is to over-engineer everything. Fight that instinct constantly.

- Use the simplest approach that works
- If 50 lines of code can do the job, do NOT write 200
- No unnecessary abstractions, no premature optimisation, no "just in case" architecture
- Before finishing anything, ask yourself: "Is there a simpler way to do this?"
- If a junior developer would struggle to read your code, it is too complex
- For simple, obvious fixes, just do the simple thing. Do not over-engineer it.
- For non-trivial changes, pause and ask yourself "is there a more elegant way?" If a fix feels hacky, implement the cleaner solution instead.

### 2. ONLY TOUCH WHAT YOU ARE ASKED TO TOUCH

This rule exists because breaking it causes the most frustration for non-technical users.

- Do NOT refactor files you were not asked to change
- Do NOT "tidy up" or "improve" code outside the scope of the request
- Do NOT remove comments, variables, or functions that seem unused unless explicitly asked
- Do NOT rename things for "consistency" as a side effect
- If you notice something that should be fixed elsewhere, MENTION it but do NOT change it
- Changes should only touch what is necessary. Avoid introducing bugs.

### 3. BE DECISIVE, NOT INTERROGATIVE

The person you are working with cannot answer deep technical questions. They need you to make good calls on their behalf.

- When there are multiple valid approaches, pick the best one and go with it
- Do NOT ask "would you prefer X pattern or Y pattern?" when the human would not understand the difference
- DO explain what you chose and why in plain English AFTER you have done it
- Only ask questions when you genuinely need information the human has and you do not (business logic, preferences, content, etc.)

### 4. EXPLAIN LIKE A TEAMMATE, NOT A TEXTBOOK

- Use plain language. No jargon without explanation.
- When something goes wrong, explain what happened and what you are doing to fix it
- Do not dump stack traces or error logs without a human-readable summary first
- Frame things in terms of what the user will SEE and EXPERIENCE, not what the code does internally

### 5. WHEN YOU BREAK SOMETHING, OWN IT AND FIX IT

- If your change causes an error, say so immediately
- Explain what went wrong in one sentence
- Fix it before moving on
- Do NOT silently hope the user will not notice

### 6. WHEN THINGS GO SIDEWAYS, STOP AND RE-PLAN

- If something is not working as expected, do NOT keep pushing in the same direction
- Stop immediately, explain what went wrong, and propose a new approach
- Do not stack fix on top of fix on top of fix. Step back, rethink, and start fresh if needed.

### 7. FIX BUGS WITHOUT HAND-HOLDING

- When given a bug report, just fix it. Do not ask the user to explain the code to you.
- Look at logs, errors, and failing tests, then resolve them
- Zero context switching required from the user
- Find root causes. No temporary fixes. No band-aids.

---

## HOW TO WORK

### Before Building

For anything beyond a tiny change, share a quick plan:

```
HERE IS WHAT I WILL DO:
1. [step] - [why, in plain english]
2. [step] - [why, in plain english]
-> Starting now unless you want me to adjust.
```

Keep this short. 3-5 lines max. This is not a proposal, it is a heads-up.

### After Building

After any change, give a simple summary:

```
DONE. HERE IS WHAT CHANGED:
- [what you built or changed, in plain english]

THINGS I LEFT ALONE:
- [anything you deliberately did not touch]

ANYTHING TO WATCH:
- [potential issues or things to test]
```

### When Something Is Unclear

If requirements are genuinely ambiguous and you need human input:

- Ask ONE clear question
- Explain the two options in plain language
- Recommend one
- Example: "Should clicking 'Submit' send the user to a thank-you page or keep them on the same page? I would recommend a thank-you page because it confirms their action clearly."

### When You Spot a Problem with the Plan

If the human asks for something that will cause problems:

- Build what works, not what was described badly
- Explain: "You asked for X. I built it slightly differently because [plain english reason]. Here is what I did instead and why it is better."
- If it is a big deviation, flag it BEFORE building

---

## LEARNING FROM MISTAKES

### Self-Improvement Loop

- After ANY correction from the user, log the lesson at the bottom of this file under SESSION LOGS
- Write it as a short rule that prevents the same mistake happening again
- Review these lessons at the start of every session
- The goal is to make fewer mistakes over time on THIS specific project

### Verification Before Done

- Never say something is finished without proving it works
- Run tests, check logs, demonstrate correctness
- Ask yourself: "Would a senior developer approve this?"
- Challenge your own work before presenting it

---

## THINGS TO NEVER DO

1. Over-engineer a solution when a simple one exists
2. Ask technical questions the user cannot answer
3. Refactor or "clean up" code outside the task
4. Remove code you do not fully understand
5. Write 10 files when 2 would work
6. Add frameworks, libraries, or dependencies unless truly necessary
7. Leave broken code without flagging it
8. Use jargon without a plain-english explanation alongside it
9. Build "flexible" or "extensible" architecture nobody asked for
10. Go silent when stuck instead of saying "I am stuck on X, here is what I have tried"
11. Keep pushing when something is clearly not working instead of stopping to re-plan
12. Apply temporary fixes instead of finding the root cause

---

## REMEMBER

The person you are working with is smart but not technical. They are building a real business. Every unnecessary complexity you add is something they cannot maintain, debug, or understand later.

Simple code that works beats clever code that impresses. Every time.

Your job is to be the developer they would hire if they could afford a great one. Decisive. Clear. Protective of simplicity. Shipping working software.

---

## SESSION LOGS

_(Sessions 2026-03-31 through 2026-04-04 archived in CLAUDE_ARCHIVE.md)_

---

### Session: 2026-04-08 (continued — deployment + domain)

**What we did:**

1. **Fixed Replit deployment — blank page on publish.** Multiple layers of issues, resolved one by one:

   - **Root cause 1:** `BASE_PATH` env var was required in `vite.config.ts` and threw if missing — production build was silently crashing. Fixed: default to `"/"`.
   - **Root cause 2:** API server had no `express.static` or SPA fallback — frontend was never served. Fixed: added both to `app.ts`.
   - **Root cause 3:** `.replit` had no `[deployment.build]` or `[deployment.run]` — Replit didn't know how to build or start the app. Fixed: added `build` and `run` keys directly inside `[deployment]` (NOT as sub-tables — Replit ignores those).
   - **Root cause 4:** Frontend built to `artifacts/souklick/dist/public` but only `artifacts/api-server` ships in the container. Attempted fix: changed Vite outDir to `artifacts/api-server/dist/public`. Replit's AI agent later reverted outDir to local `dist/public` and added other fixes (trust proxy, credentials:include, error overlay in index.html). This left a path mismatch — server looking at wrong folder.
   - **Root cause 5:** `manualChunks` in vite.config.ts split React into its own chunk, causing `Cannot set properties of undefined (setting 'Children')` crash at startup. Fixed: removed `manualChunks` entirely.
   - **Current fix applied end of session:** `app.ts` updated to look for frontend at `path.resolve(__dirname, "../../souklick/dist/public")` to match where Vite now outputs.

2. **Connected `souklick.com` domain via Namecheap** — DNS verified, SSL provisioned by Replit.

**STATUS: Blank page NOT fully confirmed fixed at end of session.** The path mismatch fix was applied but not deployed/tested. Next session must verify `souklick.com` loads the app correctly.

**Key files modified this session:**
- `artifacts/souklick/vite.config.ts` — removed manualChunks, BASE_PATH/PORT defaults, outDir back to local `dist/public`
- `artifacts/api-server/src/app.ts` — added static serving + SPA fallback + trust proxy + debug logging; frontend path = `../../souklick/dist/public`
- `.replit` — added `build` and `run` keys to `[deployment]`
- `lib/api-client-react/src/custom-fetch.ts` — added `credentials: "include"` to all fetch calls
- `artifacts/souklick/index.html` — added JS error overlay for debugging

**Resolved next session (2026-04-09):**
- `souklick.com` confirmed working (Replit agent fixed the deployment)
- Debug logging and 503 fallback removed from `app.ts`

**All resolved.**

---

### Session: 2026-04-09

**What we did:**

1. **Confirmed souklick.com is live** — Replit agent fixed the deployment last session. Cleaned up debug logging and 503 fallback from `app.ts`, removed unused `fs` import.

2. **Set APP_URL** — user set `APP_URL=https://souklick.com` in Replit Secrets so the widget script uses the correct URL.

3. **Updated favicon** — replaced plain red square with orange gradient rounded square + bold white "S" matching the sidebar logo. Added `?v=2` cache-buster to `index.html`.

4. **Stripe Customer Portal confirmed working** — backend endpoint was already built. User activated the portal in Stripe dashboard (test mode first, then live). Button in Settings → Billing works end-to-end.

5. **Fixed restaurant-specific language throughout the app** — app is now generic for any business type.
   - Sign-up: "Restaurant Group Name" → "Business Name"
   - Locations: removed all "restaurant location" references
   - Placeholders: "Saffron Kitchen Downtown/LLC" → generic examples
   - Brand Voice: example review/responses no longer food-specific
   - Platform instructions: "your restaurant's Zomato/TripAdvisor page" → "your business's"
   - AI tags: removed `food`, `ambiance`; added `quality`, `communication`
   - AI prompt: "restaurant review" → "business review"
   - Dashboard topic filter updated to match new tags

**No corrections from user this session.**

---

### Session: 2026-04-07

**What we did:**

1. **Added trial expiry warning emails** — users on trial plans now get automated warnings before their access ends.

   Files created:
   - `artifacts/api-server/src/lib/trial-warnings.ts` — `checkAndSendTrialWarnings()` queries orgs with `subscriptionPlan = 'trial'` whose `trialEndsAt` falls within a ±12h window around 3 days or 1 day from now. Sends to all users in each org. No DB changes needed — time windows naturally deduplicate.

   Files modified:
   - `artifacts/api-server/src/lib/email.ts` — added `sendTrialWarningEmail({ to, fullName, daysLeft })`. Branded HTML template; urgency colour changes (amber → red) for 1-day warning. CTA button links to `/upgrade`.
   - `artifacts/api-server/src/index.ts` — scheduler fires 1 minute after server startup, then every 24 hours. Errors are caught and logged without crashing the server.

2. **Added filters to Location Detail page** — users can now filter the review list by platform, rating, and status.

   Files modified:
   - `artifacts/souklick/src/pages/location-detail.tsx` — added Platform / Rating / Status dropdowns in a filter bar above the review list. A "Clear" button appears when any filter is active. Empty state message changes to "No reviews match these filters" with a clear link when filters are on.

3. **Fixed Settings default tab** — opening `/settings` now lands on the Profile tab instead of Brand Voice.

   Files modified:
   - `artifacts/souklick/src/pages/settings.tsx` — default prop changed from `"brand-voice"` to `"profile"`.

4. **Removed dead test-email router** — cleaned up leftover import and registration in `routes/index.ts`.

5. **Fixed pre-existing TypeScript error in `team.ts`** — `req.params` destructuring caused a type mismatch with Drizzle's `eq()`. Fixed with explicit string cast.

**No corrections from user this session.**

---

### Session: 2026-04-08 (continued — style audit + app health check)

**What we did:**

1. **Visual redesign — 4 targeted improvements:**

   - **Dark sidebar** (`artifacts/souklick/src/index.css`): Switched sidebar from white to dark navy-charcoal (`222 20% 11%`) in light mode. All major review management competitors (Podium, Birdeye, ReviewTrackers) use a dark sidebar — single biggest "pro SaaS" visual upgrade.
   - **Inter font activated** (`artifacts/souklick/src/index.css`): Inter was already loaded in `index.html` but the font stack started with SF Pro. Flipped order so Inter renders first — consistent cross-platform (not just Apple devices).
   - **Rating-based left border on review cards** (`artifacts/souklick/src/components/review-card.tsx`): Green border = 4–5 stars, amber = 3 stars, red = 1–2 stars. Priority cards keep their existing red outline.
   - **Sidebar email text fix** (`artifacts/souklick/src/components/layout/sidebar.tsx`): Email line used global `text-muted-foreground/70` (dark grey) — invisible on dark sidebar. Changed to `text-sidebar-foreground/45`.

2. **Full 10-point app audit — all clear:**
   - All 16 API routes registered and reachable
   - All frontend pages routed in App.tsx
   - No broken imports anywhere in components or pages
   - All frontend fetch/hook calls match real server endpoints
   - All DB schema tables exported from `@workspace/db`
   - Circular import (review-card ↔ review-modal) confirmed fixed
   - Widget script `/widget.js` confirmed registered
   - Scheduler confirmed wiring: trial warnings + competitor refresh + weekly digest all firing
   - TypeScript clean across frontend, API server, and DB package

3. **Deleted dead file** — `artifacts/api-server/src/routes/test-email.ts` was unregistered but still on disk. Deleted.

**No pending items. No corrections from user this session.**

---

### Session: 2026-04-07 (continued)

**What we did:**

1. **Fixed review response flow** — four issues resolved in `review-modal.tsx` and `ai.ts`:
   - Removed misleading "Successfully posted to the platform" language. Toast and banner now say "Approved — copy and post on [platform]."
   - Added optional **Notes for AI** textarea. Managers can give context before generating (e.g. "mention we fixed the issue"). Notes are passed to the AI prompt via `userNotes`.
   - Added **Copy button** next to the response textarea (shows tick + "Copied!" for 2s).
   - Renamed "Approve & Publish" → "Approve Response".
   - Fixed `draftedBy: null` in `ai.ts` — now stores `req.session.userId`.

2. **Built review request feature** — users can now email customers a direct link to leave a review.

   Files created:
   - `lib/db/src/schema/review-requests.ts` — new `review_requests` table (id, orgId, locationId, customerName, customerEmail, platform, sentAt, sentBy). DB migration run and confirmed.
   - `artifacts/api-server/src/routes/review-requests.ts` — `POST /api/review-requests`. Validates platform ID is configured on the location, saves record, sends branded email non-blocking.

   Files modified:
   - `artifacts/api-server/src/lib/email.ts` — added `sendReviewRequestEmail()`. Google links direct to write-review dialog; Zomato/TripAdvisor link to profile page.
   - `artifacts/api-server/src/routes/index.ts` — registered reviewRequestsRouter.
   - `artifacts/souklick/src/pages/location-detail.tsx` — "Request Review" orange button in header opens a 3-field modal (customer name, email, platform). Platform dropdown only shows platforms connected to that location.

**Pending items for next session (feature backlog in priority order):**

1. **Response templates** — save reusable canned responses, skip AI for quick replies
2. **Multi-location summary dashboard** — all locations side-by-side with ratings and pending counts
3. **Review tagging / sentiment topics** — auto-tag reviews by topic (food, service, wait time)
4. **Competitor tracking** — monitor a competitor's Google rating over time
5. **Weekly digest email** — Monday summary: new reviews, avg rating, response rate
6. **QR code generator** — printable QR that links to your Google review page
7. **WhatsApp / SMS review alerts** — higher open rate than email for urgent bad reviews
8. **Public review widget** — embeddable snippet showing best reviews on your website

- **Email system still untested end-to-end** — `RESEND_API_KEY` and `EMAIL_FROM` must be set in Replit Secrets, and a custom sending domain configured in Resend for production.

**No corrections from user this session.**

---

### Session: 2026-04-08

**What we did:**

1. **Competitor tracking** (`#4`) — monitor rival Google ratings over time.
   - Two new DB tables: `competitors` and `competitor_snapshots` (created directly via SQL)
   - `lib/google-places.ts` — fetches rating + review count from Google Places API (`GOOGLE_PLACES_API_KEY` required)
   - `lib/competitor-refresh.ts` — daily batch refresh for all competitors
   - `routes/competitors.ts` — CRUD: add/delete competitors, manual refresh, get history
   - `components/competitors-section.tsx` — comparison cards + Recharts rating history line chart on location detail page
   - Daily refresh wired into existing scheduler

2. **Weekly digest email** (`#5`) — Monday morning summary per location.
   - `lib/weekly-digest.ts` — Monday-only check, skips orgs with zero new reviews that week
   - `lib/email.ts` — `sendWeeklyDigestEmail()`: one card per location (new reviews, avg rating, response rate colour-coded), red "Needs attention" block for ≤3★ reviews

3. **QR code generator** (`#6`) — printable Google review link per location.
   - `components/qr-code-modal.tsx` — `qrcode.react`, Print popup auto-triggers browser print, Download saves PNG
   - "QR Code" button in location header when Google Place ID is set

4. **SMS / WhatsApp alerts** (`#7`) — Twilio-powered review alerts.
   - `notificationPhone`, `notificationSms`, `notificationWhatsapp` columns added to users
   - `lib/sms.ts` — `sendSmsAlert()` and `sendWhatsAppAlert()` via Twilio
   - Review alert trigger updated to fire SMS/WhatsApp alongside email
   - Notifications settings page updated with phone field + two toggles
   - **Requires:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` in Secrets

5. **Public review widget** (`#8`) — embeddable snippet for customer websites.
   - `widgetToken` column on locations (generated on demand)
   - `GET /api/widget/:token` — public CORS-open, returns top 5 reviews rated 4★+
   - `GET /widget.js` — self-contained embed script, `APP_URL` baked in at serve time
   - `components/widget-embed.tsx` — embed snippet with copy button on location detail page

**All 8 backlog items are now complete.**

**Secrets needed for new features:**
- `GOOGLE_PLACES_API_KEY` — competitor rating auto-fetch
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` — SMS/WhatsApp alerts
- WhatsApp requires the Twilio number to be a WhatsApp Business number (or Twilio sandbox for testing)

**No corrections from user this session.**
