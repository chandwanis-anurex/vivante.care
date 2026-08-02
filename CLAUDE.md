# VivanteCare Platform

npm workspaces monorepo: `apps/web` (Vite + React + TS + Tailwind), `apps/server`.

```
npm run dev:web      # http://localhost:5173
npm run build:web     # tsc -b && vite build
npm run dev:server
npm run build:server
npm run lint          # currently broken — no ESLint config committed (pre-existing, unrelated to landing page work)
```

## Major overhaul: stripped to landing + login + product pages (latest session)

**Everything below this section describes code that no longer exists.**
Kept for history — none of it describes the live app anymore. The org,
worker, and staffing-agency (admin) workflows, and every hook/lib that
supported them (`useScheduleStore`, `useOrgRegistry`, the matching
engine, mock data, org registration, etc.), were deleted wholesale — a
deliberate clean-slate decision, not an accident. Those workflows will
be rebuilt from BDD documents the user is providing separately, one
workflow at a time. Until then, `apps/web/src` only has:

- `App.tsx` — routes: `/` (landing), `/login`, `/about`, `/products/:slug`.
- `pages/LandingPage.tsx`, `pages/LoginPage.tsx`, `pages/AboutPage.tsx`
  (placeholder — real content pending), `pages/ProductDetailPage.tsx`
  (shared "how it works" page for all four products, driven by
  `lib/products.ts`).
- `components/layout/{Header,Footer,PageShell}.tsx`,
  `components/ui/{Button,Card}.tsx`, `hooks/useSession.ts`, `lib/utils.ts`
  — the only surviving shared infrastructure.

**`Header.tsx`** now carries a standing top nav (Home / What is
VivanteCare? / Schedule a Demo / Call Us / Login Now) on every page — no
more landing-page-only CTA branching, no more role-based logo destination
(logo always links to `/`, since `lib/roleHome.ts` is gone). Still
session-aware: shows "Signed in as X · Logout" if `useSession` has a
session, else "Login Now".

**`LoginPage.tsx`** still has the real org/worker role-picker + form, and
still calls `setSession` on submit — but there's nowhere to navigate to,
so it shows an inline "you're signed in, dashboards are being rebuilt"
message instead. The org-name field is a plain text input now (no
`useOrgRegistry` to pick from), and the "register here" link is gone
(`/register` was deleted with the org flow).

**Fourth product, VivanteHomeCare™** (`lib/products.ts`, `slug: 'homecare'`):
home-caregiver training/certification for a family member — every US
state has its own certification (NJ's is the Homemaker Health Aide
certification). Its actual program isn't built here; it lives on a
separate site that doesn't exist yet. No `externalUrl` is set for it
deliberately — don't invent one. `ProductDetailPage.tsx` shows a
"Coming Soon" placeholder for it instead of a real/dead link. It also has
no `headshot` (none supplied) — the landing tile and detail page both
fall back to rendering its first feature's icon in the photo-circle
position instead.

**`Card.tsx`** gained a `cyan` accent (token already existed, previously
only used for footer icon accents) specifically for VivanteHomeCare's
tile/detail page.

## Landing page rebrand (from an earlier session — see note above)

The marketing site was rebuilt to match a design pulled from Claude Design
(`claude.ai/design`, project "Interactive Brand Prototype Tool",
id `3e5ff4ab-4eaf-420e-94f5-850968eaa489`, file `VivanteCare Landing.dc.html`).
That project also has `vivantecare_design_system.md`, which `tailwind.config.js`
mirrors 1:1 — if brand colors or type scale change, update the Claude Design
doc first, then port the values here.

**Scope decision:** the user chose a *full rebrand*, not a landing-page-only
patch — new tokens and the reskinned `Header`/`Footer` apply to every page
(login, org dashboards, worker dashboards), not just `/`.

### Brand tokens (`apps/web/tailwind.config.js`)

| Token | Hex | Usage |
|---|---|---|
| `navy` | `#0B1E3B` | primary brand, headers, buttons |
| `teal` | `#14A99B` | primary accent, VivanteHaaS |
| `cyan` | `#00B8D9` | footer icon accents |
| `purple` | `#8B5CF6` | VivantePassport accent only |
| `gray` | `#F4F5F7` | section backgrounds |
| `graytint` | `#F4F7FA` | why-choose section band |
| `charcoal` | `#091E42` | body text |
| `muted` | `#5B6472` | secondary copy |

Font-size scale (`xs`…`9xl`) was renumbered to match the design doc exactly
(this shrank `lg`/`xl`/`2xl`/`3xl`/`4xl`/`5xl` by 1-3px site-wide; `text-5xl`
through `text-7xl` were only used on the landing page at the time, so no
other pages needed auditing). All border radii are reset to `0` globally in
`index.css` — `rounded-full` is used explicitly only for the headshot circles.

### Components touched

- **`Header.tsx`** — official logo lockup (see **Logo assets** below),
  pinned flush left with `pl-10` to line up with the hero's `p-10` inset.
  CTA buttons (See a Demo / Book a Call) + Login on the right. No
  section-nav links in the bar — those live in the landing page's own
  utility link row instead.
- **`Footer.tsx`** — dark navy "Our Promise / Our Vision / Contact + QR"
  panel (matches the `.dc.html` footer), replacing the old 5-column link
  footer. Has `id="book-a-call"` so the header CTA scrolls somewhere real.
- **`LandingPage.tsx`** — full rebuild: hero banner, 3-product ecosystem row
  (VivanteHaaS™/VivantePassport™/VivanteIQ™) with connector arrows, dark
  VivanteIQ stats panel, utility link row, 5-tile benefits grid, why-choose
  checklist section.
- **`Card.tsx`** — added a `purple` accent variant for VivantePassport.

### Anchor wiring

- `#how-it-works` → product ecosystem section
- `#see-for-yourself` → why-choose section
- `#book-a-call` → footer contact column
- `#faqs` → dangling on purpose (no FAQ section exists yet; matches the
  source design's own incomplete state — don't "fix" this without asking)

### Logo assets (source of truth: `/logos` at repo root)

The `/logos` folder holds the official brand package (Main/Side/Text-only
lockups + Fav Icon, each as `.svg`/`.png`/`.jpg`, plus `.ai`/`.eps`/`.pdf`
source files) — this **supersedes** the earlier Claude Design placeholder
logo. Colors: "Vivante" is `navy`, ".Care" is `teal` (the original
hand-coded header text had this backwards — teal Vivante / navy .Care —
fixed when the real assets were wired in).

Only the SVGs actually referenced by the app are copied into
`apps/web/public/`; the rest of `/logos` stays as reference/future use:

| File in `public/` | Copied from `/logos` | Used in |
|---|---|---|
| `images/vivante-care-logo.svg` | `Vivante.Care_Side Logo.svg` (icon + wordmark + tagline, horizontal) | `Header.tsx`, `sm:` and up |
| `images/vivante-care-icon.svg` | `Vivante.Care_Fav Icon.svg` (mark only) | `Header.tsx`, below `sm:` (compact) |
| `favicon.svg`, `favicon.png` | `Vivante.Care_Fav Icon.svg`/`.png` | `index.html` `<link rel="icon">` |

`Main Logo` (stacked) and `Text Only` haven't been wired into any page yet
— no current layout calls for them, but they're available in `/logos` if
a future screen needs a vertical lockup or icon-free wordmark. **No
reversed/white variant exists** — don't drop the colored logo onto the
navy `Footer.tsx` background as-is (the navy "Vivante" text would
disappear); that needs a dedicated white asset first.

### Images (`apps/web/public/images/`)

| File | Used in | Source |
|---|---|---|
| `vivantecare-nurse-banner.jpg` | hero | Claude Design project assets |
| `headshot-haas.png` | VivanteHaaS card, round | user-supplied (`HaaS-Portal/images/headshot1.png`; resized from 5.7MB/2400×1792 → ~290KB) |
| `headshot-passport.jpg` | VivantePassport card, round | user-supplied (`headshot2.jpg`) |
| `headshot-iq.jpg` | VivanteIQ card, round | user-supplied (`headshot3.jpg`) |
| `vivanteiq-laptop.jpg` | dark VivanteIQ panel | user-supplied (`laptop.jpg`) |
| `vivanteiq-phone.jpg` | dark VivanteIQ panel, next to laptop | user-supplied (`phone.jpg`); a first version (`phone.png`) had a baked-in white margin that needed cropping — current file is pre-cropped, no CSS trickery needed |
| `healthcare-meeting.jpg` | why-choose section | user-supplied (`healthcaremeeting.jpg`) |

All `image-slot` placeholders from the original `.dc.html` have real images now.

### Verification

`tsc -b && vite build` passes clean after every change in this session. No
browser automation was available in-session (no `chromium-cli`/Playwright,
user opted out of the Chrome extension) — visual checks were done via the
Vite dev server + the user's own screenshots/feedback, not automated
screenshots. If a future session has browser tooling, it's worth doing a
proper visual pass.

## Dashboard visual refresh + admin-mediated shift requests (later session)

- **Font**: Manrope → Inter (`index.html`'s Google Fonts link,
  `tailwind.config.js`'s `fontFamily.sans`) — chosen for on-screen
  legibility at the app's small dashboard sizes.
- **Type scale**: every `fontSize` value bumped +20% over the rebrand's
  original scale (rounded to the nearest 0.5px). **The Claude Design doc
  (`vivantecare_design_system.md`) was not updated to match** — this
  deviates from the "update the doc first" rule above; port these values
  back if that doc needs to stay authoritative.
- **Hero banner on every logged-in page**: `PageHero.tsx` (previously only
  used by the landing page) is now rendered by `DashboardShell.tsx` itself
  via a required `hero: { eyebrow?, title, subtitle? }` prop, full-width
  between `Header` and the sidebar/main row, same nurse photo and 420px
  height as the landing hero. `OrgLayout`/`WorkerLayout`/`AdminLayout` all
  forward `hero` from the page. Every page's old inline `<h1>` was moved
  into that prop — there is no page-level `<h1>` left anywhere in the
  dashboards.
- **Admin-mediated shift assignment**: orgs can no longer assign a worker
  directly. Both entry points — `OrgShiftsPage`'s Auto-Match/Browse picker
  and the new Passport Vault → passport detail → "Request Shift" flow
  (`PassportDetailPage.tsx`, `/org/passport-vault/:id`) — set a
  `preferredPassportId` on the `ShiftRequest` and land on
  `pending_admin_review`. Admin (`AdminShiftsPage.tsx`'s new "Pending
  Review" section) either confirms the preferred worker (routes into the
  existing `AssignRequest` accept/reject/expiry flow, unchanged) or
  suggests a substitute (`pending_org_response` — org sees an Accept/Cancel
  card). Admin's own direct-assign picker on `AdminShiftsPage` (Auto-Match/
  Manually Assign in "All Shifts") is untouched — admin picking a worker
  already is the approval. Workers get a "Mark Shift Complete" button once
  a shift's `endDate` has passed, which is what makes
  `AdminPassportsPage`'s new "Current Status" column flip back to
  "Available" — that column is a live derivation from `shiftRequests`, not
  a separately tracked field. The worker's own `shared` per-field toggle
  (`ownPassport.ts`) stays exactly as decorative as it was before this
  session — the new passport detail page shows every field, matching how
  `PassportVaultPage`'s list already worked, not gated by that toggle.
