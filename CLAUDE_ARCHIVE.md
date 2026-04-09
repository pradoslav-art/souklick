# CLAUDE_ARCHIVE.md — Old Session Logs

---

### Session: 2026-03-31

**What we did:**
- Created CLAUDE.md — the working agreement and rules file for this project
- Ran session-start checks: git pull, git status, git log — repo was clean and up to date
- Confirmed the last committed work was authentication and session management (commit: `d13ac12`)
- Committed CLAUDE.md and .claude/settings.local.json, then pushed to GitHub

**No corrections or lessons this session — first session establishing the workflow.**

---

### Session: 2026-04-01

**What we did:**

1. **Confirmed existing auth system** — session-based login/signup/logout, bcrypt passwords, protected routes, data scoped per org via `organizationId`.

2. **Built full admin dashboard at `/admin`** — accessible only if user email matches `ADMIN_EMAIL` env var.
   - Files: `adminAuth.ts`, `routes/admin.ts` (5 endpoints), `pages/admin.tsx`
   - Dashboard: user metrics, review responses, conversion funnel, retention, speed, feature usage, power users, charts, CSV exports
   - Placeholders: revenue (needs Stripe), geography (needs IP), devices (needs PostHog), error log (needs Sentry)

---

### Session: 2026-04-02

**What we did:**

1. **Confirmed `ADMIN_EMAIL` set** to `souklickuae@gmail.com` — dashboard live.
2. **Added Stripe subscription payments** — Monthly ($29/mo) and Yearly ($295/yr) via hosted checkout.
   - Files: `routes/billing.ts`, `pages/upgrade.tsx`, `pages/billing-success.tsx`
   - DB: added `stripeCustomerId`, `stripeSubscriptionId` to orgs; "monthly"/"yearly" to plan enum
   - No webhooks yet — confirmation via redirect + session verify
3. **Mobile optimisation** — lazy loading, slide-in sidebar drawer, responsive layouts, `h-dvh`
4. **Fixed horizontal overflow on mobile** — removed `-mx-8`, added `overflow-x-hidden`
5. **Fixed Settings tabs overflow** — `grid grid-cols-3`, hide icons on mobile
6. **Removed motivational quote** from dashboard
7. **Fixed dashboard filter/scroll on mobile** — removed height trap, natural scroll
8. **Performance** — QueryClient defaults (staleTime 30s, gcTime 5m), prefetch chunks
9. **Skeleton screens** — Dashboard, Priority, Locations, Analytics pages

---

### Session: 2026-04-03

**What we did:**

1. **Enforced trial expiry** — expired trial users blocked at API + frontend, redirected to `/upgrade`.
   - `requireActiveSubscription` middleware added to all business routes
   - Sidebar trial banner shows days remaining; goes red when expired

---

### Session: 2026-04-04

**What we did:**

1. **Stripe webhook endpoint** — handles `subscription.updated`, `subscription.deleted`, `invoice.payment_failed`
   - Registered at `POST /api/billing/webhook` with `express.raw()` middleware
   - `STRIPE_WEBHOOK_SECRET` set in Replit Secrets, endpoint active in Stripe
2. **Removed `framer-motion`** dead dependency from `souklick/package.json`
3. **Added nodemon file watcher** to API server dev mode — auto-rebuild on changes

---
