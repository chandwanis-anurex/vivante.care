# VivanteCare Platform

npm workspaces monorepo: `apps/web` (Vite + React + TS + Tailwind), `apps/server`.

```
npm run dev:web      # http://localhost:5173
npm run build:web     # tsc -b && vite build
npm run dev:server
npm run build:server
npm run lint          # currently broken — no ESLint config committed (pre-existing, unrelated to landing page work)
```

## Landing page rebrand (this session)

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
