# Justlife Design System — Handoff / Current State

> **Read this first when resuming.** It is the single source of truth for *where we are*.
> Architecture rationale lives in [`architecture.md`](architecture.md); the original plan is at
> `~/.claude/plans/happy-weaving-hedgehog.md`. Cross-session working agreements are also in the
> assistant's auto-memory (`MEMORY.md`).
>
> Last updated: **2026-06-23** (see §24 for the latest: funnel component-promotion pass — 10 atoms extracted; §23: `Toast` + Avatar-contrast; §22: GitHub repo + sharing, the SDK lesson, Profile/funnel polish)

---

## 1. What this is

A **code-first design system, component library, and prototyping platform** for Justlife.

- **Code is the single source of truth.** Figma is reference/audit only.
- **Mobile-first** (React Native), with **Mobile Web + Desktop Web** as first-class targets.
- Goal: rebuild **every component in the Justlife Figma file** as real, token-bound coded
  components, built **bottom-up**, **only components that fully resolve to tokens**. Components
  that need external-library variables or photo/raster assets are **parked** (see §9).

### Hard rules (from the user — do not violate)
1. **Never invent assets, tokens, or components.** It's the *company's* DS — when something is
   missing, **ask the user and they'll direct you**. (memory: `company-ds-ask-before-adding`)
2. **All visual values come from DS tokens.** No raw hex/px — enforced by the `justlife/no-raw-values`
   lint rule. Typography is **Poppins** via typography tokens everywhere. (memory: `typography-poppins-tokens`)
3. **Don't share screenshots** in chat. Verify visually for yourself, then describe the result.
4. **Figma token** lives only in a git-ignored `.env` (`FIGMA_TOKEN`). Never paste/hardcode it.
5. **Icons = Lucide.** Custom/brand icons only via extraction *when explicitly directed*.

---

## 2. Repo layout (as built)

```
justlife-design-system/
├─ packages/
│  ├─ tokens/   @justlife/tokens   DTCG JSON → Style Dictionary v4 → dist (CSS + typed TS)
│  └─ ui/       @justlife/ui       primitives + components (RN + react-native-web)
├─ apps/
│  └─ storybook/  @justlife/storybook   Storybook 8 (react-native-web-vite)
├─ tools/
│  ├─ figma-sync/   Figma REST API helpers (inventory/spec/svg/variables/textstyles + logo gen)
│  ├─ tokens-import/  exported Figma JSON → canonical DTCG
│  └─ generators/     plop component scaffolder
├─ docs/   architecture.md · governance.md · contributing.md · platform-rules.md · adr/ · HANDOFF.md (this)
└─ Variables/   raw exported Figma variable JSON (token source input)
```

Only `tokens` and `ui` are published packages today. `apps/storybook` is the catalog/preview surface.

---

## 3. How to run & verify (environment gotchas — important)

`pnpm` runs via **corepack**, through a shim at `~/.local/bin/pnpm`. Always prefix shell calls:

```bash
export PATH="$HOME/.local/bin:$PATH" && export COREPACK_ENABLE_DOWNLOAD_PROMPT=0 && pnpm …
```

- **`COREPACK_ENABLE_DOWNLOAD_PROMPT=0` is mandatory.** Without it, corepack blocks on an
  interactive "download pnpm@9.15.0?" prompt with no TTY and **hangs forever** — this was the root
  cause of the dev server appearing dead. It's set in `.claude/launch.json` env and must be exported
  in every Bash `pnpm` call. (memory: `pnpm-shim-environment`)
- **Never run `pnpm` verification concurrently with the Storybook dev server.** Concurrent runs
  starve Vite and blank the canvas ("No Preview"). Run verification **once, after the server is
  idle**, ideally with `run_in_background: true`. (memory: `pnpm-shim-environment`)

### Dev server
- Use the **preview tools** (`preview_start` with config name `storybook`), **not** Bash, to run it.
  Config in `.claude/launch.json`: `corepack pnpm@9.15.0 --filter @justlife/storybook run dev`, port **6006**.
- Phone testing on LAN: `http://<mac-ip>:6006` (last known IP `192.168.102.2` — re-check; it changes).
  Note Storybook renders stories inside an iframe; to view a screen fullscreen open the
  `/iframe.html?id=<story-id>&viewMode=story` URL directly.

### Per-change verification recipe (run in this order, single background run)
```bash
pnpm --filter @justlife/ui typecheck
pnpm --filter @justlife/ui test      # vitest
pnpm lint                            # eslint, incl. justlife/no-raw-values
```
Current baseline: **typecheck ✓ · 48 test files / 189 tests ✓ · lint ✓.**

**Gift Card (side-quest) — RETIRED (2026-06-19).** Built then parked at the user's request; the screen
(`GiftCardFlow.stories.tsx`) and the `GiftCard` component were removed. Design learnings worth keeping if
we revisit: **the layered header can BE the product** (an occasion-themed gradient hero that updates live,
**pinned** so the form scrolls inside the card and the preview stays visible), a **custom `AED ___` input
as the section hero** with presets demoted to quick-fills, and per-occasion token-colour theming. **Gotcha
learned:** adding/removing a `*.stories.tsx` needs a **Storybook restart** (preview_stop+start) or you get
`importers[path] is not a function` (stale story index).
Then visually confirm via preview tools (snapshot/inspect/eval). Take screenshots only for your own
verification — **do not share them**.

---

## 4. Token architecture

- **Source:** W3C **DTCG JSON** (`packages/tokens/src`, fed from exported Figma variables in `Variables/`)
  → **Style Dictionary v4** → outputs: **CSS custom properties** (web) + **typed TS** theme object.
- **3 tiers:** primitive → semantic → component. Components reference semantic/component, never raw.
- **Light theme only** (no dark theme — `dark.d.ts` exists in dist but light is what's used).
- **Consumption:** `useTheme()` returns `t`; e.g. `t.space.md`, `t.size['12']`, `t.radius.default`,
  `t.background.secondary`, `t.icon.primary`, `t.iconSize.lg`, typography variants on `<Text>`.

### Scales you'll use a lot
- **`space`** (spacing scale): `xs=4, sm=8, md=16, lg=24, xl=32`.
- **`size`** (geometry primitives, off-scale allowed): `…2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32,
  40, 48, 56, 64, 72, 80, 96, 120, 160, 200, half=0.5`.
- **`radius`**: `none=0, sm=4, md=8, default=12, lg=12, xl=16, 2xl=24, pill=999, control=12, card=12`.
- **`safeArea`** (added 2026-06-19 — device safe-area insets, iOS reference): `safeArea.top=44`
  (status-bar/notch), `safeArea.bottom=34` (home indicator). Bottom-anchored floating/docked bars sit
  `safeArea.bottom` above the screen edge (matches iOS / Instagram). Used by `CheckoutBar` (default
  `safeAreaBottom`) and `BottomNavigation` (default `safeAreaInset`). Source:
  `packages/tokens/src/semantic/scale.json`.
- **`motion`** (added 2026-06 — the user authorised inventing animation tokens; see memory
  `company-ds-ask-before-adding`): `motion.duration.{instant 0, fast 120, medium 200, slow 320}` (ms,
  raw number in TS for RN `Animated`; `ms` in CSS) + `motion.easing.{standard, decelerate, accelerate}`
  (cubic-bezier arrays — spread into `Easing.bezier(...)` / rendered as CSS `cubic-bezier()`). Source:
  `packages/tokens/src/semantic/motion.json`. Used by `BottomNavigation` (and next, the Header collapse).
- **Surface elevation (inverted 2026-06-19):** **white = raised, `#FBFAF7` = recessed.** Pages use the
  new **`background.canvas`** (`#FBFAF7`); cards on the page use **`background.surface`** (`#FFF`); modals
  (`BottomSheet`) use **`background.surface-raised`** (`#FFF`); fills **nested inside** a white surface
  (sheet cards, close-circle, `NoteChip`, inputs) stay **`background.secondary`** (`#FBFAF7`). The old
  model was white pages + warm cards; we swapped the warm cards to `surface` and repointed pages to
  `canvas`. `PaymentMethodCard` gained a `recessed` prop (white by default; `#FBFAF7` inside the sheet).
  Storybook's phone-frame bg is now `#FBFAF7` so white cards pop in the catalog. Full rule: AGENTS.md.
- **Yellow CTA text (2026-06-19):** the yellow primary CTA (`Button variant="secondary"`, bg `#FFCC27`
  — Next/Complete/Apply/Save) now uses **dark amber text `#7A4A00`** (`btn.secondary.text`, was white
  `#FFFFFF` ≈ 1.5:1, failed contrast → now ~5:1) and a **gold pressed bg `#E6B400`** (`btn.secondary.bg-active`,
  was brown `#B86819` which only suited white text). Light **and** dark themes. DS-wide via the token.
- **Brand blue:** the brand blue is **#00C3FF** (`blue/500`) — used for all fills/icons/borders and,
  as of 2026-06, **`text.brand`** too (changed from the darker `#00A8DC`/`blue/600` per user ruling, so
  brand text matches fills). `text.link` stays the darker `#00A8DC`. Edit `text.brand` in
  `packages/tokens/src/themes/light.json` + run `pnpm tokens:build` to regenerate `dist`.
- **Typography variants** (Poppins): `headlineSmall`, `titleMedium`, `titleSmall`, `labelBase`,
  `labelMedium`, `labelXSmall`, `bodyBase`, `bodyXSmall`, … (size/weight/line-height baked in).

### Spacing convention (memory: `spacing-snap-to-scale`)
Off-scale Figma spacing **snaps to the nearest `space` step** (e.g. 12→sm/8? no — see exceptions).
**Exceptions deliberately chosen by the user:** ServiceCard & PaymentMethodCard padding use
**`t.size['12']`** (12, equal on all sides) — the user explicitly compared 8 vs 12 and **locked 12**.
Tight component geometry uses off-scale `size` primitives (`size['2']`, `size['6']`, `size['12']`).

---

## 5. Component architecture

- Authored in **React Native primitives**, rendered to web via **react-native-web**.
- **Platform split:** `Foo.tsx` (native) + `Foo.web.tsx` (web). `.web` is resolved first
  (configured in `vitest.config.ts` and storybook `main.ts`) so `react-native-svg` never enters the
  web bundle.
- **Icons:** Lucide — `lucide-react` (web) / `lucide-react-native` (native), platform-split `Icon`.
  Default **`strokeWidth = 1.5`** (was 2; user said 2 was "too thick" — keep 1.5). `Icon` supports an
  optional `fill` prop (used for filled stars).
- **Icon-size convention** (`iconSize`: **xs 12** / sm 16 / md 20 / lg 24 / xl 32 — all tokenized, no
  raw icon sizes):
  - **`xs` (12)** → icons inside chips/pills/sublines (Badge, StatusBadge, "You rated" subline).
  - **`sm` (16)** → DEFAULT: inline/leading icons next to body text, **all chevrons**, in-`Button`
    leftIcon/rightIcon, clock/map-pin/note icons, small CTA plus/x.
  - **`md` (20)** → focal/status icons (InfoCard alert, ReviewCard play) + standalone tappable action
    icons (edit/delete).
  - **`lg` (24)** → large focal (RatingSummary star) + avatar fallback in 56px avatars.
  Avatar fallback scales with avatar size (lg in 56, md in 40). Note: equal sizes can still *look*
  different by glyph density (e.g. `calendar` reads heavier than `x` at 16) — that's the glyph, not a
  size bug; don't per-glyph-tune.
- **Per component folder:** `Component.tsx` (+ `.web.tsx` where needed), `index.ts`, `.stories.tsx`,
  `.test.tsx`, and where present `.docs.mdx`.

---

## 6. Components built so far

**Primitives** (`packages/ui/src/primitives`): `Box`, `Stack`/`HStack`/`VStack`, `Text`, `LinearGradient`.

**Core** (atomic controls / shells — sidebar group "Core"):
`Badge`, `Button`, `Card`, `CategoryShape`, `Checkbox`, `Icon`, `Input`, `NoteChip`,
`ProfessionalAvatar`, `QuantityStepper`, `Radio`, `SearchBar`, `SelectableCard`, `StatusBadge`, `Toggle`.

**Components** (composite cards — sidebar group "Components"):
`AddOnsCard`, `AddressCard`, `BookCard`, `BookingStatusCard`, `BookingSummary`, `BottomNavigation`, `CashbackCard`,
`CategoryCard`, `CreditPackageCard`, `FlexCard`, `InfoCard`, `NotificationCard`, `PackageDetailsCard`,
`PaymentMethodCard`, `PlanBookingCard`, `PriceDetails`,
`ProductCard`, `ProfessionalCard`, `ProfessionalReplacementCard`, `RatedCard`, `RatingSummary`, `ReviewCard`,
`ServiceCard`, `ServiceTileRow`,
`SpecialInstructions`, `TabGroup`, `ThankYouCard`, `VoucherCodeCard`.

**Screens** (`packages/ui/src/screens`): `WomensSalon.stories.tsx` (see §8).

### Notable component specifics
- **Button** — sizes `2xs|xs|sm|md|lg` (heights ~22 / ~32 / 40 / 48 / 56). **`2xs`** (~22px,
  `paddingVertical: space.xs`, label `labelXSmall`) is *only* for the "Add" button that toggles with
  the 22px `sm` QuantityStepper (heights must match so the row doesn't reflow — ServiceCard / FlexCard /
  ProductCard). **`xs`** (~32px, `paddingVertical: space.sm`, label `labelXSmall`) is the **default
  in-card CTA** size (ThankYouCard pills, PlanBookingCard footer, Apply/Buy/Add-Tip/Select). Both
  compact sizes use `radius.md` + `gap space.xs`. **`compact` prop** trims horizontal padding to
  `space.sm` (8) for dense icon+label CTAs.
  **`tone` prop** (`brand`/`danger`/`neutral`) recolours the label + icon by intent, keeping the
  variant's bg/border — e.g. a white `pill` with brand-blue or red text (ThankYouCard's action bar).
- **QuantityStepper** — sizes `sm`(btn 22)/`md`(btn 26)/`lg`(btn 32). `alignSelf:'center'`. At `min`,
  the minus button becomes a **trash** icon ("Remove"). Collapsed (count ≤ 0) = single `+` "Add".
  All card "Add ↔ stepper" controls unified to **22px** so the price row doesn't reflow on add.
- **Badge** — shared. `tone='rating'|'success'|'neutral'|'brand'|'danger'|'warning'`, optional
  `icon`+`iconFilled`. Padding `paddingHorizontal: space.sm` (8) / `paddingVertical: size['2']` (2)
  — the 8px sides apply to **all** badge usages (ReviewCard, CreditPackageCard, ServiceCard,
  BookingStatusCard, PlanBookingCard). Default `alignSelf: 'flex-start'` (so a standalone badge in a
  column shrinks + left-aligns); in a centered row, override `style={{ alignSelf: 'center' }}` so it
  centres with its neighbours (e.g. the rating badge next to a name).
- **ServiceCard** — composite. `cta='add'|'select'` (Add Button when qty 0 ↔ QuantityStepper `sm`
  when qty>0). `padding: size['12']`, `radius.xl`. optionsTag (purple `background.options`), duration
  (clock icon), description, price row (price + strikethrough oldPrice + `<Badge tone="success">`
  discount), expandable details panel (`padding: space.md`). No qty prefix before the title.
- **PaymentMethodCard** — **most recently worked on (see §7).** icon slot (40px fixed width), title,
  optional masked `number`, `trailing` OR selectable mode. Brand logos via `PaymentLogo`.
  `trailingTone` (2026-06-19): `muted` (default, secondary status like "Default") or `action`
  (link-coloured CTA like "Change"). Bordered whenever selectable **or** it has a `trailing` (so an
  actionable "current method" row reads as a card). Checkout uses the non-radio form: the chosen card
  with **"Change" inside it** (tap row to switch), no radio — there's one current method, not a choice.
- **Radio** — sizes `sm`(box 16, dot 7)/`md`(box 24, dot 12). **Default is `sm`** (user: radios
  should default to sm). PaymentMethodCard's & AddressCard's selectable radios inherit this.
- **CategoryShape** — brand shape per Justlife vertical: `clean`(#00C3FF) / `heal`(#AAED1D) /
  `care`(#FF7272) / `assist`(#FFCC27). Platform-split (web `<img>` data-URI, native `SvgXml`), static
  (no animation). SVGs live in `apps/storybook/public/Vertical=*.svg`; inlined into
  `CategoryShape/shapes.ts` by **`tools/figma-sync/gen-category-shapes.mjs`** (re-run if the SVGs
  change). `ServiceCategory` type is exported.
- **ProfessionalAvatar** — square avatar: a `CategoryShape` behind the professional's **square** cutout
  `photo` (URI). No photo → the coloured shape is the placeholder (replaces the old grey-circle +
  user-icon). Props: `category`, `photo?`, `size?` (56), `confirmed?` (check overlay), `label?`.
  Sample photos (demo only) at `apps/storybook/public/profile photos/profilepic_*.png` (84×84, alpha),
  referenced from stories via `/profile%20photos/…`. **Real photos come from data at runtime** — the
  component is photo-source-agnostic. **All three pro cards now compose it** — ThankYouCard (**md 56**),
  BookingStatusCard (**md 56**, with `confirmed` check overlay), PlanBookingCard (**sm 40**). Size
  convention: **sm 40 / md 56** (a real photo needs ≥40px to read; 24px is too small). PlanBookingCard's
  footer was restructured to **avatar + name-over-rating column** so longer names don't truncate next to
  a wide button.
- **StatusBadge** — shared tinted status pill. `tone` (`success`/`info`/`error`/`warning`/`neutral`) →
  tinted bg + fg token pair; optional `icon` (the `error` tone defaults to `circle-alert`). `labelXSmall`
  label, `paddingHorizontal: space.sm`, `radius.sm`. **PlanBookingCard composes it** (extracted from its
  inline pill). No `alignSelf` baked in (lives in a row → parent centres it; in a column set
  `alignSelf:'flex-start'`). Distinct from `Badge` (saturated chip): StatusBadge is the lighter status
  pill. NOTE: `BookingStatusCard` deliberately uses a different treatment (coloured headline + chevron),
  so it does **not** use StatusBadge — could adopt it later if you want pills there too.
- **SelectableCard** — shared shell for selectable list rows (Figma "Selectable Item"). Owns the
  container box, selected `background.selected` + brand border, press behaviour (Pressable when
  `onPress`+`!disabled`, else View) and the horizontal row layout. Knobs: `selected`, `disabled`,
  `background` (unselected bg), `padding`, `minHeight`, `gap`, `border` (`always`|`whenSelectable`|
  `none`). **`PaymentMethodCard` and `AddressCard` both compose it** — domain cards supply only their
  content + trailing controls. This is the **"one base, many wrappers"** answer to Figma's multi-use
  "Selectable Item": share the *structure* (shell + primitives), not the *meaning* (no god-component).
  Future selectable rows (professional, package, …) should build on it too.
- **AddressCard** — saved-address card (Figma "Address Selection → Selectable Item"). type icon +
  `labelXSmall` label + optional "Default" `Badge` + address (`bodyXSmall`) + optional note
  (`bodyMicro`, brand-coloured when `selected`) + optional error (`bodyXSmall` error). Trailing:
  `selected` → `sm` radio + `background.selected`/brand border; `onEdit`/`onDelete` → pencil(brand)/
  trash(error) icons. Padding `space.md` (16), gap `space.sm`, radius `default`. Border width is
  **constant** (`thin`), only the colour changes on select, so rows don't grow ~1px when selected.
  The Figma 60×60 image is intentionally **omitted** (hidden in the real rows; would be a photo
  asset + off-scale size). The title row has a **fixed `height: size['16']`** so the (17px-tall)
  "Default" badge can't nudge the text/height when it toggles — rows stay equal with or without it.
- **PlanBookingCard** — booking/subscription summary. **Styled in the new DS** (the user shared
  old-app screenshots for *content/variants/states* only; old visuals like the dashed separator,
  fully-round pill button, inline rating, and large type were intentionally **not** copied). bg
  `secondary`, radius `default`, padding `size['12']`, hairline border, vertical `gap sm`. Title
  (`titleSmall`) + **status pill** (shared `StatusBadge`) = `statusTone` (`success`/`info`/`error`/
  `warning`/`neutral`) + free `statusLabel` + optional `statusIcon` (error auto-shows `circle-alert`). label→value **table**
  (`rows`; `highlight`→brand value, `bold`→`labelXSmall`), optional discount `Badge`, **solid**
  separator, footer (pro avatar placeholder + name + rating `Badge tone="rating"` + optional
  `userRating`/`onEditRating` "You rated ⭐ X · Edit" subline + `Button size="xs"` with `buttonIcon`
  — card CTAs stay compact `xs`, per the locked card-CTA pattern; not `sm`/`md`).
  **`stacked`** renders the subscription depth effect: 2 absolute `tertiary` layers + hairline borders
  peeking below (approximates the old greys without new tokens — subtle by design).
  **Token note:** the `info` status bg uses `background.brandSubtle` (#B3EEFF); the old #E6F9FF
  (`color.blue.50`) isn't a semantic token.
- **ThankYouCard** — post-booking status card (Figma "Thank You Card", 8 variants). Adapted to the new
  DS: card `radius.default` (Figma was 20), bg `secondary`, padding `12`(V)/`md`(H). A tappable brand
  `title` (`bodyBase`) + chevron, a `message` (`bodyXSmall`), an optional trailing **professional**
  (`ProfessionalAvatar` with the **rating `Badge` overlapping the avatar's bottom edge** + name below —
  compact, so the pro block doesn't add empty space above the title) **or** an `illustration` slot (used by the "confirmed"
  variant), and an optional **pill action bar** (`actions` → `Button variant="pill" size="xs"` full
  width — ~32px, matching every other in-card CTA). **Action pills default to `tone="neutral"`**
  (#1A1A1A) — brand blue is reserved for the title + pro name, so the actions stay quiet/co-equal and
  don't fight the heading. Don't use red for the in-card Cancel (it over-highlights the least-wanted
  action); reserve `tone="danger"`/red for the actual cancel-*confirmation* step. The Figma's stylized
  cutout-photo pro is intentionally replaced by our avatar pattern. `BookingStatusCard` overlaps it (status + message +
  pro) but uses a headline-status; kept separate.
- **ProfessionalCard** — compact standalone pro chip (Figma "Professional Card"): `ProfessionalAvatar`
  (category shape + photo) + rating `Badge` overlapping the avatar bottom + name (`labelXSmall` brand)
  below; optional `onPress` (for "choose your pro" rows/grids). Props: `category`, `name`, `photo?`,
  `rating?`, `size?` (64), `onPress?`. Same overlapping-rating pattern as ThankYouCard's pro block —
  could replace those inline blocks for full consistency (follow-up).
- **PackageDetailsCard** — package summary row (Figma "Package Details Card"). bg `secondary`, radius
  `default`, padding `size['12']`, content `gap xs` (title→desc). Title (`titleSmall` 13) + description
  (`bodyBase` 13 secondary — kept full-size since the package name is the key detail; hierarchy via the
  title's bold weight, like BookingStatusCard) + optional
  **remaining pill** (reuses `StatusBadge tone="info"`, `alignSelf:'flex-start'`) + disclosure chevron
  (`sm`, shown when `onPress`). `state="expired"` → title in `error` red + hides the remaining pill.
- **ProfessionalReplacementCard** — current pro → swap arrow → replacement pro (Figma "Professional
  Replacement Card"). Each row: `ProfessionalAvatar` (40, category+photo) + name (`labelXSmall` brand) +
  rating `Badge` + sub-line (`bodyMicro`; current pro's reason in **error red**, new pro's info in
  **primary**). Omit `replacement` → collapsed/"locked" (current pro + brand `chevron-down`). The Figma
  uses plain grey circles; we use `ProfessionalAvatar` since our photos are shape-cutouts.
  **Domain rule (enforced in the API):** a replacement is always within the **same service category** —
  a heal pro can only be replaced by another heal pro, never heal→beauty. So `category` is a single
  **card-level** prop shared by both pros; `ReplacementPro` carries no `category` of its own. Stories
  reuse the one heal photo for both pros for now (only one demo photo per category exists in
  `profile photos/` — add a second heal headshot to show two distinct faces).
- **InfoCard** — info/success/etc. note card; used inline on the Women's Salon screen.
- **BottomNavigation** — bottom nav bar (Figma "Navigation Bar", a `COMPONENT_SET` with `active=`
  variants: Home/Bookings/Wallet/Profile), **evolved to the Instagram-style floating pattern** per the DS
  owner (researched Dec 2025 / Feb 2026 "Liquid Glass" nav: slimmer floating pill that shrinks on scroll;
  we skip the glass/translucency and keep an opaque surface). Data-driven `items` (3–5:
  `key`/`label`/`icon`/`badge`), controlled `activeKey` + `onTabPress`.
  - **Sliding highlight pill (not a per-tab background):** one shared pill that **slides** to the active
    tab on tap. Implemented as an absolute full-bar track (`flexDirection:row`) holding an animated-width
    **spacer** + a one-tab-wide slot; growing the spacer (`slide` value → `width` %) glides the pill. Uses
    `width`-% (RNW animates that per-frame; it does **not** animate `left`-%), so it's measurement-free and
    auto-tracks the compact width. Pill = `tabbar.bg.active` (#B3EEFF), inset `size.6` (6) on **all sides**
    (slot `padding`) → 44px tall in the 56px bar, keeping equal margin top/bottom/sides even at the far
    edges. Active icon = `tabbar.icon.active` (#00C3FF brand), inactive = `tabbar.icon.default` (#7E8080);
    **icon strokeWidth is constant 1.5** (active is no longer thickened). Active label `labelXXSmall`
    (9/13 semibold) `text.primary`; inactive `bodyMicro` `text.secondary`.
  - **Slim + shrink-on-scroll (IG proportions):** dimensions taken from a measured Instagram nav
    (screen 630w → expanded 564×90, compact 474×76 ⇒ ~16% shrink each axis). **`compact`** prop shrinks
    the pill ~16% in both dims: width `EXPANDED_WIDTH_RATIO` **0.8952** → `COMPACT_WIDTH_RATIO` **0.7524**
    of the row (as a `width`-%, centred by an outer `alignItems:'center'` wrapper — **no `onLayout`/measuring**),
    height `size.56` (56) → `size.48` (48), and labels collapse (height→0, opacity→0) to icon-only. Docked
    (`floating={false}`) shrinks vertically only. Drive `compact` from the screen's scroll offset (see the
    `ShrinkOnScroll` story). **First animated component:** RN `Animated.timing` (`progress` drives
    width/height/label; `slide` drives the highlight), `useNativeDriver:false`, using the new **`motion`**
    tokens (`motion.duration.medium` 200ms + `Easing.bezier(...motion.easing.standard)`).
    > Verified statically (endpoints exact: expanded ratio 0.8952 / 56h, compact 0.7524 / 48h; pill lands
    > under each tab with equal 8px margins; stroke 1.5). The *motion* can't be filmed in the headless
    > preview (rAF throttled there → JS-driven anims jump to end in probes) but uses the standard pattern.
  - `floating` (default) → `radius.pill` + `elevation.sheet` shadow; `floating={false}` docks full-width
    with a `divider.color.default` hairline top border. **`safeAreaInset` defaults to `safeArea.bottom`
    (34px, added 2026-06-19)** so the bar clears the iOS home indicator — applies to **both** layouts now
    (floating: 34px below the pill via the centring wrapper; docked: padded up by it). Anchor the floating
    bar flush to `bottom: 0`; pass `safeAreaInset={0}` for isolated catalog showcases. Badges: count
    (`badge: number`, capped "9+" at >9, `badge.bg.danger` pill + white `onError`) *and* dot (`badge: true`).
    a11y: `role=button` + `accessibilityState.selected`, badge folded into the accessible label.
  - **Flagged token-vs-art discrepancy:** Figma's component art draws the active icon dark teal `#134453`,
    but the DS token `tabbar.icon.active` is brand blue `#00C3FF` — built to the **token**; revisit if the
    intended look is the dark icon.
- **SearchBar** (`Core/`) — search field (Figma "Search bar" → `Input/SearchMobile`; the set's other
  states just wrap it with an address selector / trailing filter button, left as compositions). Pill
  (`radius.pill`, h `size.40`, border `borderWidth.thin`) using the dedicated **`search.*`** tokens:
  rest `search.bg.default` (#FBFAF7) + `search.border.default` (#DDDDDD), focus → `search.bg.active`
  (#F5F5F5) + `search.border.active` (#7E8080). Leading `search` icon (`icon.secondary`, size sm),
  `bodyXSmall` (11/14) text in `text.primary`, placeholder `input.placeholder.color` (#AAAAAA), and a
  circular **clear button** (`size.16`, `icon.secondary` bg, white `x`, `hitSlop space.sm`) shown only
  when `value` is non-empty. Controlled (`value` + `onChangeText`); `onClear` overrides the default
  clear-to-empty. Mirrors `Input`'s RNW TextInput conventions (`typographyToStyle` for Poppins,
  `outlineStyle:none` from RNW so focus shows only via the border/bg swap). Figma art bg is #FFFFFF; we
  use the (barely off-white) `search.bg.default` token.
- **TabGroup** — Tab Group (Figma "Tab Group" / "Tab Item"). A row of card tabs, each a card
  (`radius.default` 12) with a `labelXSmall` (11/14) title + optional `bodyMicro` (9/13) subtitle,
  centred. **Two layouts:** `scrollable` (the Figma default — `overflowDirection: HORIZONTAL_SCROLLING`,
  fixed-`tabMinWidth` 139px tabs in a horizontal `ScrollView` that peeks the next tab; verified
  scrollWidth 433 = Figma frame) and the equal-width **fill** (`flex:1`, gap `space.sm`) for a few short
  tabs. Single-select, controlled `activeKey` + `onChange`.
  Selected = `border.brandDefault` (#00C3FF); default = `border.default` (#DDDDDD). **Border width is
  constant (`borderWidth.thin`, colour-only change)** to avoid the 1px jitter (same fix as AddressCard).
  a11y: `role=button` + `accessibilityState.selected`, subtitle folded into the accessible label.
  **Flagged token gap:** Figma fills the *selected* tab with a faint `#F3FDFF` wash that has **no DS
  token** (nearest is `background.brandSubtle` #B3EEFF, much stronger; the exact tint is only Tier-1
  `color.blue.50`/`incentives.tierNew`). Built **brand-border-only, transparent fill** (closest token-pure
  match to that near-invisible wash). Title/subtitle use `text.primary`/`text.secondary` (Figma art is
  #232424 / #7E8080 — near-exact). Revisit if you want a real selected fill (add a token, or use brandSubtle).
- **PriceDetails** — checkout bill (Figma "Price Details"). A `background.secondary` card (`radius.default`,
  `size.16` padding, `space.md` section gaps): `titleSmall` heading (default "Price Details", `null` to
  hide) → line-item rows (`bodyXSmall`; label `text.secondary` + optional `info` icon, amount `text.primary`
  or **`tone:'success'` → `icon.success` #8BC34A** green for discounts) → divider → total row → optional
  **payment-method row** (composes `PaymentLogo`, e.g. `visa`) → optional tappable **receipt footer** (white
  `background.primary` box, `receipt` + label + `chevron-right`). Amounts are pre-formatted **strings** —
  the **AED currency glyph is a parked custom asset** (consumer formats the value). **Two deviations:**
  (1) **divider** uses `divider.color.default` (#DDDDDD, visible) — Figma's is card-coloured `border.subtle`
  (#FBFAF7, *invisible* on the card); chose a real separator for a bill, flag to revert. (2) **total is not
  emphasised** (Figma is `w400`, same as rows) — matched Figma; say if you want a bold total.
- **BookingSummary** — booking summary (Figma "Summary" → `summary=with payment`). `background.secondary`
  card: `titleSmall` header (default "Booking Details", `null` to hide) → **detail rows** (`bodyXSmall`;
  label `text.secondary` left, value `text.primary` right, multi-line/right-aligned) where a row's value
  can be a **professional chip** (24px circular avatar — photo or `user` fallback — + `text.link` name,
  optionally tappable, + `star`/rating) → optional **`price`** breakdown (`{rows, total}`, reuses
  `PriceDetailsRow`; discounts green, fees with info). Content from the Figma node (Date & Time,
  Professional Leila 4.7, Add ons, Materials, Duration, Frequency, Subtotal/Discount/Fee/Total).
  **Improved over the Figma (user: "not looking good"):** the original is a flat 11-row block with
  **invisible** card-coloured dividers and a same-weight buried total. Here sections are split by
  **visible `divider.color.default` dividers** and the **total is emphasised** (`labelBase` 13 semibold,
  `text.primary`) so it's scannable. Currency = pre-formatted strings (AED glyph parked).
  **`layout` prop (two options):**
  - `rows` (**default**) — the Figma form (label-left / value-right).
  - `grid` — caption-over-value grid, **asymmetric main (~62%) + aside (~35%)**: default items take the
    wide main column, `narrow:true` items the slim right aside (short values like Frequency/Materials),
    `wide:true` items span the full row. (`bodyMicro` label over `bodyXSmall` value; `columnGap space.sm`/
    `rowGap space.md`.)
  Stories: `WithPayment` (rows, default), `WithPaymentGrid` (grid). (A single-column `list` variant was
  prototyped — research-backed top-bottom/left-align pattern — but **removed** per the user; rows+grid kept.)

---

## 7. PaymentMethodCard — latest state (just finished)

File: [`PaymentMethodCard.tsx`](../packages/ui/src/components/PaymentMethodCard/PaymentMethodCard.tsx)

- **Two modes:** saved-method (icon + title + optional `number` + `trailing` text) and **selectable**
  (`selected` prop defined → renders a `<Radio>` + selected styling: `background.selected` +
  `border.brandDefault`). `selectable = selected !== undefined`.
- **Icon slot** is a fixed `width:40` centered `<View>` so titles line up across rows regardless of
  logo width.
- **Brand logos** were **extracted from the user's Figma as SVG** (their licensed assets, at their
  direction) and rendered platform-split:
  - `PaymentLogo.web.tsx` → `<img src="data:image/svg+xml,…">` (height 22, maxWidth 38, contain).
  - `PaymentLogo.tsx` (native) → `<SvgXml>` from `react-native-svg`.
  - `logos.ts` is **auto-generated** by `tools/figma-sync/gen-payment-logos.mjs` — exports
    `paymentLogos` `{mastercard, visa, applePay, tabby, googlePay}` and `PaymentLogoName`. **Do not
    hand-edit.** **Tamara is skipped** (its Figma asset is raster/base64, not vector).
- **Equal-height fix (this session):** title reduced to **`labelXSmall`** (matches Figma's selectable
  "Label", 11px) and the container given **`minHeight: t.size['56']`** so single-line rows (Cash) and
  two-line rows (Visa •••• 4242) are all **exactly 56px**. Verified: every row 56px in both the
  `Selectable` and `Methods` stories. Vertical centering comes from the row's `alignItems:'center'`.

### Known remaining deltas vs Figma (not yet changed — confirm with user before touching)
- Figma's *selectable* card uses **radius 20** and **white (`background.primary`)** fill; ours uses
  `radius.default` (12) and `background.secondary` to stay consistent with the rest of the card set.
  No 20 radius token exists (between `xl`16 and `2xl`24). Left as-is for system consistency.

---

## 8. Screens & the screenshot→DS workflow (validated)

`WomensSalon.stories.tsx` (`title: "Screens/Women's Salon"`, `parameters.layout:'fullscreen'`) was
built by **adapting an old-app screenshot** into the new DS. The validated workflow:

1. User shares an old-app screenshot.
2. Rebuild the page as a browser-viewable Storybook "Screens" story using real DS components.
3. **Anything missing renders as a GREEN placeholder** (`Missing` banner) so gaps are visible.
4. User only needs to **view pages in the browser** — no native app build required.

Screen shell pattern: `<View style={{width:'100%', maxWidth:430, alignSelf:'center',
backgroundColor: t.background.primary, minHeight:812}}>` + status bar + nav header + section bars +
content. InfoCards are flattened into the content `gap="sm"` VStack so margins are uniform.

**Approved future loop (not yet acted on):** design-in-context → user reviews/approves → promote the
approved design into reusable component(s). (memory: `design-in-context-promote-workflow`)

---

## 9. Storybook conventions

- **Mobile frame** (memory: `storybook-mobile-frame`): a global decorator wraps non-fullscreen
  stories in a **375px phone frame** (16px padding). Opt out with `parameters.layout:'fullscreen'`
  (truly edge-to-edge) or `parameters.mobileFrame:false` (24px plain padding).
- **Sidebar taxonomy** (`storySort`): `['Overview','Foundations','Primitives','Core','Components',
  'Patterns','Screens']`. The story `title` controls grouping — **Core** = atomic controls,
  **Components** = composite cards (see §6).
- New story files need a **dev-server restart** to be indexed. Avoid curly apostrophes in titles
  (they break story IDs — Women's Salon uses a plain `'`).

---

## 10. Figma sync tooling (`tools/figma-sync`)

Run with `node <script>.mjs` from `tools/figma-sync` (reads `FIGMA_TOKEN` from `.env`). Output lands
in `tools/figma-sync/output/`.

- `inventory.mjs` — list components in the file (`pnpm figma:inventory` from root).
- `spec.mjs` — node geometry + **token resolution** for a given node id (the workhorse for specs).
- `svg.mjs` — export a node as SVG via the Figma images API → `output/svg-<id>.svg`.
- `variables.mjs` / `textstyles.mjs` — variable & text-style dumps.
- `gen-payment-logos.mjs` — copies exported brand SVGs file→file into `logos.ts` (skips raster-backed).

**Constraint:** the Figma **Variables REST API is Enterprise-gated / `file_variables:read` scope not
available** — variables come from the **exported JSON** in `Variables/`, the REST API is used for
inventory/specs/assets.

---

## 11. Build flow with the user (the loop we follow)

**3-options selection flow** (memory: `three-options-build-flow`):
> Before each component, present **3 options**. The user checks Figma and **picks one**. Build it,
> verify it, then present **3 more**. (The user reviews Figma before choosing, so always offer the
> choice — don't just pick.)

After a build: run the verification recipe (§3), visually confirm, then offer the next 3 options.

---

## 12. Parked / backlog

**Parked components** (blocked — do not build until unblocked by the user):
- Need **external-library variables**: e.g. Tabs, Search bar, generic Row.
- Need **photo/raster assets / image overlays**: e.g. Service Image, Promo/Hero banner, Top Picks.
- **Tamara** payment logo — Figma asset is raster/base64, no vector to extract.

**Open follow-ups / known deltas:**
- **PlanBookingCard stacked effect** is built but **approximated** with `background.tertiary` +
  hairline borders (subtle on the near-white page). A crisper, more faithful stack would want 2–3
  dedicated neutral tokens (`#F4F4F4/#ECECEC/#E2E2E2`) — a system-level token addition (ask first).
  Same for a true light-blue `info` status bg (currently `brandSubtle`; old #E6F9FF has no token).
- ~~Unify the professional avatar~~ — **done**: `ProfessionalAvatar` (category shape + square photo) is
  the shared atom; ThankYouCard (md 56), BookingStatusCard (md 56 + confirmed check), PlanBookingCard
  (sm 40) all compose it. Size convention locked at **sm 40 / md 56**.
- ~~Status pill inline in PlanBookingCard~~ — **done**: extracted to shared `StatusBadge` (Core).
  `BookingStatusCard` still uses a coloured-headline status (different pattern) — optionally convert it
  to `StatusBadge` pills later for consistency with the booking-card screenshots.
- PaymentMethodCard radius/fill vs Figma selectable (see §7) — needs user decision.
- Card padding is mostly `size['12']` now; do a sweep to confirm no stray 8/16 remain.
- "Starts at"/price-prefix variants not yet supported on price rows.
- Remaining Figma components (~60) still to be queued via the 3-options flow.

**Pre-ship QA pass (do once the screens/funnel are finished — user request, 2026-06-20):**
- **Tap-target audit.** Sweep every interactive element — buttons, CTAs, inline text links, icon buttons,
  chevrons, the small ✕ closes — and confirm each has a *clickable area* ≥ `touchTarget.min` (48px;
  `comfortable` is 56px for primary CTAs). Where the **visual** is intentionally smaller, expand the hit
  area with `hitSlop` (don't enlarge the visual) — the pattern already used by `NoteChip`'s clear button
  and the sheet/voucher ✕ (`hitSlop: space.sm`). Likely offenders to check: `Button size="xs"` (~22px)
  in-card CTAs, `labelXSmall` blue links (Change / Add / Edit / Details ~11px), the applied-voucher and
  `BottomSheet` corner ✕, inline info icons, and the `CheckoutBar` expand chevron. Storybook's a11y addon
  / axe can flag some, but this is mainly a manual sweep on a real device.

**Next action when resuming:** **the Header + layered funnel work (§14) is the active task** — the user
will brief after compaction; read §14 + the screenshots, then wait for the brief. (Otherwise, the normal
loop is to present **3 component options** from the Figma queue per §11.)

---

## 13. Component inventory (quick count)

- Primitives: **5** (Box, Stack, Text, LinearGradient, RadialGlow)
- Core: **16** · Components: **35** · Screens: **4** (Women's Salon; **Home Cleaning Funnel** — 5 steps,
  Frequency first — §19; **Thank You / booking-details** — §15; **Profile / My Account** — §21)
- Tests: **51 files / 201 tests**, all green.
- Recent additions: **`Avatar`** (initials-only identity badge — Justlife has no photos) + **`ListRow`**
  (clean settings/menu row) + **`InfoCard` `action` slot** (trailing link) — all §21. Earlier:
  **`ActionRow`** (grey "icon + label + count-badge + chevron" tappable row,
  `radius.default`/`background.tertiary` — promoted out of the Thank-You screen via design-in-context),
  **`InfoCard` tone `accent`** (very-light-blue surface = `background.selected` #F4FEFF — for friendly
  non-status notices, distinct from the grey `ActionRow`s). Earlier: **`BottomSheet`**,
  `BottomNavigation`, `SearchBar`, `TabGroup`, `PriceDetails`, `StepIndicator`.

---

## 21. Profile / My Account screen + `Avatar` + `ListRow` (NEW 2026-06-22)

Redesigned the old-app **Profile / My Account** page in the DS (user shared a screenshot; it was "very
ugly" — confetti around a grey silhouette avatar, nine identical loose full-width rows, the update notice
tacked on at the bottom). The user chose the **grouped-sections** direction (of 3 offered) and ruled:
**no confetti**, and **no profile photos in Justlife → avatar uses initials**.

**Shared screen:** `packages/ui/src/screens/ProfileScreen.tsx` (frame-agnostic; props `name`/`phone`/
`safeAreaTop`/`safeAreaBottom`/`activeTab`/`onTabPress`/`onSelectItem`/`onEditProfile`/`onUpdatePress`),
hosted by `Profile.stories.tsx` (web `Phone` frame, `Screens/Profile → My Account`). Page = recessed
`background.canvas`; content in white `surface` cards. Layout: `headlineSmall` "My Account" title → a
tappable **identity `Card`** (initials `Avatar` md + name `titleMedium` + phone `bodyXSmall` + chevron) →
**three labelled groups** (`labelXSmall` secondary headers — **Account** / **Rewards** / **Support**, a
redesign addition; every row label is verbatim) each a `Card padded={false}` of `ListRow`s with
`divider` on all but the last → an **"Update" notice** + the floating `BottomNavigation` (5 tabs:
Home/Bookings/life+/Wallet/Profile, Profile active).

**Bottom stack (important — avoids the recurring "floating bar over content" bug):** the update notice is
**NOT** the last scroll item (as a scroll item it peeks awkwardly in the home-indicator zone under the
floating nav at rest, and only clears when scrolled to the very bottom — measured). Instead it is a
**pinned floating card** (`InfoCard tone="accent"` + `elevationToStyle(t.elevation.raised)` shadow, inset
`space.md` to align exactly with the menu cards) sitting in an absolute bottom container **above** the nav
(`space.sm` gap); content scrolls behind both. ScrollView `paddingBottom = bottom + size.120` clears the
whole stack. Both the container and the banner wrapper are `pointerEvents="box-none"` so taps pass through.

**Two new components (proper folders: `.tsx`/`.stories`/`.docs.mdx`/`.test`/`index`, token-only, a11y):**
- **`Avatar`** (Core) — circular **initials** badge (no photos). `toInitials("Cem Mirkelam") → "CM"`
  (first+last word, max 2; or pass `initials`). `size` sm 40 / md 56 / lg 72 (or a number) → initials use
  `titleMedium`/`titleLarge`/`headlineSmall`. `tone` `brand` (`avatar.bg.primary` #B3EEFF, default) /
  `neutral` (`avatar.bg.neutral` #F5F5F5); dark `text.primary` initials for contrast. Exposed as
  `role=image` with the name as the accessible label. Distinct from `ProfessionalAvatar` (category shape +
  cutout photo). The `avatar.bg.*` tokens already existed (reserved) — no new tokens.
- **`ListRow`** (Components) — clean settings/menu row (Figma "List item"): leading icon + `labelBase`
  label + optional trailing `value` / count `badge` (red pill, mirrors `ActionRow`) / `trailing` slot /
  chevron; `divider` (hairline, **inset under the label** = `iconSize.md + space.md*2`); `destructive`
  (red icon+label); pressed = subtle `background.secondary`. `minHeight size.48`. Non-interactive (no
  `onPress`) renders a plain row. **Distinct from `ActionRow`** (the heavier grey filled block for stacked
  one-off actions) — `ListRow` is transparent, for grouped menus on a white card.
- **`InfoCard` gained an optional `action`** (`{label,onPress}`) — a trailing `text.link` Pressable (the
  "Update" link). Backward-compatible.

**Icon gotcha (fixed):** `circle-help`/`help-circle` **do not exist** in this lucide build
(`lucide-react`/`-react-native` **1.20.0**) — the valid name is **`circle-question-mark`**. The "Get Help"
row (and a latent `ActionRow` story using `circle-help`) were silently rendering no icon; both switched to
`circle-question-mark`. When adding an icon, verify the name resolves (the `Icon` warns to the console on
an unknown name; `node -e "require('lucide-react').icons.XxxYyy"` confirms).

**Verified (web, Storybook `Screens/Profile`):** every row present + Get Help icon renders; avatar 56px
circle `#B3EEFF` "CM"; title 24 / name 16 / Update link `#00A8DC`; the 9 menu rows are a uniform 48px
content height (the +0.5px is the hairline divider between them); the update notice is fully visible at
rest, aligned to the cards (left 16 / right 374 / w 358, radius 12, shadow), `space.sm` above the nav, no
collision. typecheck ✓ · lint ✓ · **51 files / 201 tests** ✓. Native shares the same file (RN-standard
primitives; not separately device-verified this pass — `apps/prototype` has no Profile route yet).

**Open / flagged:** (1) `Avatar` initials are dark on the light-blue chip (brand-blue text fails contrast
on `#B3EEFF`); say if you want a saturated chip + white initials instead. (2) The **life+** tab uses the
`activity` (pulse) icon — closest token-free lucide match to the app's square-scan glyph; swap if you have
the real one. (3) Section headers (Account/Rewards/Support) are new copy (the original had one flat list).
(4) Not yet wired into the Expo app's tab navigation (`apps/prototype`).

---

## 22. GitHub repo, sharing the prototype, the SDK lesson & Profile/funnel polish (2026-06-22)

**Repo is on GitHub:** `https://github.com/justlifedesignstudio/justlife-design-system` — **private**, in the
**`justlifedesignstudio` org** (first pushed to `malekrim/…`, then transferred to the org so people can get
**Read**-only access — personal-repo collaborators only ever get *write*). `gh` here is logged in as
**malekrim** (org owner; git authored as malekrim); `origin` → the org. **`.env`/secrets + `.expo` are
gitignored — verified absent on the remote.** **WORKFLOW: every "bake" now ALSO `git commit` + `git push`**
to keep `origin/main` current (collaborators clone → their Claude reads the code + `AGENTS.md`). Share read-
only via repo **Settings → Collaborators and teams → Read** role. Optional for non-dev reviewers: hosted
Storybook via **Cloudflare Pages + Access**.

**Sharing the prototype (ngrok blocked on this UAE network → Cloudflare)** — full playbook in memory
`sharing-prototype-cloudflared`: Storybook (browser) + Expo Go (native) exposed via **`cloudflared` quick
tunnels**; `--http-host-header localhost` is REQUIRED (both Storybook's and Metro's dev servers 403 a
foreign Host). Metro must advertise the tunnel host via `EXPO_PACKAGER_PROXY_URL` (verify the manifest's
`hostUri`/`launchAsset.url` is the tunnel host, not localhost). **Run cloudflared + Metro as DETACHED
daemons** (`nohup … & disown`) — tracked background tasks get reaped → tunnel dies → Expo Go "hostname not
found". Serve signed-out (`expo logout` + `expo start --offline`) or Expo Go nags testers to sign in as the
owner.

**SDK 54→55→54 (a mistake, fixed):** a tester's Expo Go reported SDK 55 → I upgraded `apps/prototype` to 55
**without checking what's installable**. The App Store Expo Go is **SDK 54**, so a 55 project is too new for
every phone. **Reverted to SDK 54** (`expo ~54` · RN 0.81.5 · React 19.1). **RULE: target the SDK the
*installable* Expo Go supports; never assume "latest".** Expo Go runs one SDK and you can't pick the version
on iOS → fragile for multi-tester sharing; the robust path is a **dev build** (TestFlight/EAS, needs an Apple
Developer account) — offered, not built.

**Profile screen evolved past §21** (all committed/pushed, device-approved):
- Identity block is **display-only** (removed the tap + chevron — the **Profile** menu row edits the
  profile; the header tap was redundant).
- A subtle red **Log out** at the bottom — `text.error` text + `log-out` icon, **no card/surface**.
- Adopted the **funnel layered header** (`PageShell pinned` + brand `HeaderAurora` band), then a **hero
  header**: **no "My Account" title**, the **identity** (initials `Avatar` `lg` + name + phone) **centred in
  a tall aurora band** (`bandHeight = safeAreaTop + size.200`, via PageShell's `bandContent` slot; ~24px gap
  to the card), header is an empty status-bar slot. Menu groups (Account/Rewards/Support `ListRow`s), the
  pinned "Update" `InfoCard`, and `BottomNavigation` (5 tabs incl. life+) sit in PageShell's `footer` slot.
- **Wired into the Expo app** (`apps/prototype` Profile tab renders the shared `ProfileScreen`; added a
  life+ tab so the app nav matches).

**Funnel polish:** step titles → **`titleLarge` (20)** (`Header` `titleVariant`); header **band → size.80**
(was size.72, squeezed once the title grew; size.96 was too much). **Day-picker fix:** the Recurring weekday
chips were circles (`radius.pill`) → now the shared `Selectable`'s default `radius.control` (rounded squares,
consistent with numbers/dates/time-slots); the `Selectable` `radius` override was removed.

**`PageShell` gained `cardElevation` + `cardShadow`** for the band↔card **seam shadow**: `cardElevation`
(token, default `raised`) or `cardShadow` (raw `ElevationToken` override). Profile uses a soft upward seam
shadow (`rgba(26,26,26,0.08)`, offsetY -2, blur 24). **The pinned content card is now TWO layers** (outer =
shadow + rounded bg, inner = `overflow:hidden` clip) so the shadow renders on **native** — iOS
`overflow:hidden` was clipping it (showed on web, not in Expo).

**New components (in §13 counts):** **`Avatar`** (initials-only badge — no photos in Justlife) + **`ListRow`**
(clean settings/menu row, distinct from the grey `ActionRow`) + **`InfoCard.action`** slot (trailing link).
**Lucide gotcha:** `circle-help`/`help-circle` don't exist in lucide 1.20.0 → use **`circle-question-mark`**.

**Still open (minor):** life+ tab icon is the placeholder `activity` (user will design a real glyph later —
leave as-is). Optional older polish: Next→Complete label crossfade.

---

## 23. `Toast` / `Snackbar` component + the Avatar-contrast decision (2026-06-23)

**`Toast` / `Snackbar`** (Components — adds to the §13 count) — transient self-dismissing feedback bar.
User picked it from the 3-options flow and said **"redesign it with your knowledge"** (explicit licence to
design, not copy Figma). Design: a **dark bar** (`background.inverse` #1A1A1A, `radius.xl` 16,
`elevation.overlay`) so it stays distinct from the light cards/sheets; the **tone is a coloured leading
icon** (success `circle-check`/`icon.success`, error `circle-alert`/`icon.error`, info `info`/`icon.info`
— note **info = yellow** in this DS — warning `triangle-alert`/`icon.warning`, neutral = no icon), **not** a
tinted bar. White `text.inverse` message, `text.brand` action label, muted `✕`. Two parts:
- **`Toast`** — presentational, animates itself (slide + fade via the `open`-lifecycle + `settle`-timeout
  idiom copied from `BottomSheet`; `useNativeDriver:false`). Props: `message`, `tone`, `icon`, `action`,
  `dismissible` (✕ defaults on when there's no action), `open`, `position` `top|bottom`, `onDismiss`,
  `onExited`.
- **`ToastProvider` + `useToast()`** — imperative host: `toast.show/success/error/info/warning(msg, opts)` +
  `dismiss(id?)`. One toast at a time, the rest **queue**; auto-dismiss 6s with an action else 4s
  (`duration:0` = sticky); announces via `AccessibilityInfo`; renders an absolute `box-none` overlay at
  `zIndex.toast`, above the safe-area inset (`insets` prop, defaults to `safeArea` tokens). Wrap a
  screen/app root once.

a11y: bar is `accessibilityLiveRegion="polite"`; **error** toasts get `role="alert"`. Green: typecheck ✓
lint ✓ **52 files / 209 tests** (+8). **Verified in Storybook** (computed styles exact: `#1A1A1A` / 16px /
`0.12 0 6 16` shadow / 48px minH / white Poppins / per-tone icon strokes `#8BC34A`·`#EF4444`·`#F87B19`;
console clean; the `useToast` Interactive story mounts). The **live click-to-fire + slide animation is
device-territory** — headless preview can't fire RNW Pressable (synthetic DOM events) and starves rAF
([[preview-raf-starved-animations]]); the imperative path is covered by a unit test instead. **Not yet
wired into `apps/prototype`** (offered).

**Avatar-contrast decision (closes the §22 open item):** investigated — the shipped Avatar already renders
dark `text.primary` (#1A1A1A) on `avatar.bg.primary` (#B3EEFF) ≈ **13.7:1, passes AA**. The DS's *reserved*
`avatar.text.color` (#00A8DC) on that bg is only ≈2.17:1 and **fails** — the component deliberately does
**not** use it. Offered bolder-brand vs keep-soft; **user chose keep-soft** (no visual change). Added a
**guard comment** in `Avatar.tsx` so the reserved cyan token isn't "restored" and silently regress contrast.

## 24. Funnel component-promotion pass — 10 atoms extracted (2026-06-23)

**Why:** the screens were built *design-in-context* with the *promote-to-components* step deferred; the user
flagged that the funnel's reusable pieces were still **local in-file functions** (no stories/docs/tests),
violating "reuse, don't hand-roll/duplicate." Did an audit first (`docs/funnel-promotion-audit.md`) — the
inventory + naming/reconciliation decisions — then a **5-bake pass**. (Also corrected a stale fact: "When
would you like your service" is **step 4**, not 3; the `StepNContent` names were stale and are now renamed.)

**Promoted (each: component + stories + docs + tests; screen refactored import-only, no visual change,
verified in Storybook):**
1. **`Selectable`** — the foundation selection chip (brand fill + border). Distinct from `SelectableCard`
   (the big card). The pickers below all compose it. (`a11feb4`)
2. **`DatePicker`** · **`TimeSlotPicker`** · **`WeekdayPicker`** — single/single/multi-select strips over
   `Selectable` (they now own the selected-text colour the screen used to set by hand). (`d47b318`)
3. **`NumberSelector`** (segmented count, ≠ `QuantityStepper`) · **`PillGroup`** (single-select pills, ≠
   `TabGroup`) · **`Question`** (labelled section: inset title + full-bleed children). (`a027678`)
4. **`PlanSelectCard`** — built **on `SelectableCard`** (per user's choice), internalises the bullet rows.
   Two systemic fixes shipped with it: **`SelectableCard`** now sets `accessibilityState.selected` (was
   unannounced); **`Radio`** gained **`interactive={false}`** — a decorative, a11y-hidden visual ring for
   when an enclosing control owns the press (kills the latent *nested-interactive* radio-in-button that the
   old `FrequencyCard` had). (`5fb75a1`)
5. **`PromiseList`** (icon/title/desc reassurance list) · **`ScreenAurora`** — the brand aurora band, which
   was defined **byte-identically in BOTH** the funnel and Profile → promoted once, both import it
   (`RadialGlow` import dropped from both screens). (`ecbc2b2`)

**Deferred (per user):** the *overlap set* — the step-4 pro chooser (vs `ProfessionalCard`/`ProfessionalAvatar`),
`AppliedVoucherCard` (vs `VoucherCodeCard`), `CancellationDisclaimer` (vs `InfoCard`) — stays **inline** for a
later reconciliation batch. Other still-inline (correctly screen-specific): the 5 step bodies, the BottomSheet
contents, `ServiceSummaryCard`, `MissingLogo`. **62 files / 240 tests green.** Every bake committed + pushed.

## 14. Funnel architecture — Header + PageShell + Home-Cleaning screens (polish pass DONE) · Flex NEXT

> **Home-Cleaning polish pass — DONE & VERIFIED (2026-06-19).** Fine-tuning round on the funnel design.
> Component/system changes:
> - **Header** `overMedia` (transparent expanded → fades to surface + subtle `raised` shadow on collapse),
>   `safeAreaTop` (status-bar/notch inset; screens pass 44).
> - **PageShell** scroll model simplified — band scrolls **in-flow** behind the pinned header (no fragile
>   parallax); card shadow softened `sheet`→`raised`; added `footer` slot earlier. Verified: header pins at
>   `top:0`, collapses to solid white + subtle shadow, content scrolls under it (inner scroll).
> - **SpecialInstructions** now has a `background.secondary` surface (was white-on-white).
> - **AddOnsCard** is now **full-width / fills its column** (was fixed 116px → dead space in grids).
> - **Screens** (`HomeCleaningFunnel`): `Phone` wrapper fills the viewport (absolute-fill) so inner scroll
>   works + header stays pinned; one `Selectable` helper gives **every choice control the same radius**
>   (`radius.control` 12) — numbers, Yes/No pills, dates, time slots; bigger section spacing (`gap lg`);
>   info icons unified to `sm` (16) + top-aligned; "Powered by" sits next to the title (not far-right);
>   add-ons in a clean 2-col grid.
>
> **"Bold" finding (measured, not guessed):** all design text renders Poppins **500/600 only** — no 700.
> The only 700s on screen are **Storybook's own docs/controls UI (Nunito Sans)**, not our components. The
> DS already caps at SemiBold (600); section labels lightened to Medium (500) where they felt heavy.
>
> **DS-reconciliation backlog** (for the "adapt the DS to the finished home-cleaning design" phase the
> user planned — do these as DS work, not screen-local):
> - Promote the screen-local **`Selectable`** into a real DS control (single radius, selected = brand fill).
> - **`NoteChip` uses `radius.sm` (4)** — inconsistent with the forced control radius (`radius.control` 12);
>   reconcile (the funnel stopped using NoteChip for choices because of this).
> - `fontWeight` tokens still define **`extrabold` (800) / `black` (900)** though the DS caps at SemiBold —
>   consider removing so "no Bold" is enforced at the token level.
> - Footer redesign is the user's explicit **next step** (left as the simple `FunnelFooter` for now).


> **Slice 3 — Home-Cleaning funnel screens — BUILT & VERIFIED (2026-06-19).**
> `packages/ui/src/screens/HomeCleaningFunnel.stories.tsx` — all 4 steps as `Screens/Home Cleaning
> Funnel` stories (`1 · Home Cleaning`, `2 · Popular Add-ons`, `3 · Date & Time`, `4 · Checkout`), content
> taken from `screenshots/IMG_0226–0229`. Each is `PageShell` (aurora band) + `Header` (`overMedia`, step
> N/4) + sticky `FunnelFooter` (Total + secondary/yellow CTA). Composes real components: `AddOnsCard`,
> `ProfessionalCard`, `PaymentMethodCard`+`PaymentLogo`, `VoucherCodeCard`, `PriceDetails`,
> `SpecialInstructions`, `NoteChip`, `InfoCard`, `Card`; screen-local helpers for number/date selectors.
> Brand logos (Powered-by / tabby) shown as GREEN placeholders. Verified in-browser: all 4 render, every
> content element present, no error overlays. typecheck ✓ · lint ✓.
> Two enabling additions this slice:
> - **`Header` gained `overMedia`** — transparent while expanded (band shows through) → fades to surface +
>   hairline as it collapses. Fixes the "white bar over the band" problem; reuses `hexToRgba`.
> - **`PageShell` gained a `footer` slot** — sticky bottom bar below the scroll area (the Total + CTA bar);
>   shell refactored to a flex-column stage + footer. `band` is the slot (was `bandColors`).
>
> **Floating `CheckoutBar` footer — BUILT & VERIFIED (2026-06-19).** `packages/ui/src/components/CheckoutBar/`.
> The funnel's floating, expandable bottom bar (Figma `bottom-floating`): collapsed = total (+ optional
> strikethrough `oldTotal`) + CTA + chevron; tapping the chevron/handle expands **upward** into a
> `PriceDetails` summary (drag handle + breakdown). Floats like `BottomNavigation` (collapsed = full
> `radius.pill`; expanded = `radius.xl` **top** corners but **bottom corners pinned to `size.32`** = the
> collapsed 64px-tall bar's half-height pill curvature, so the total/CTA base looks identical across
> states — `pill`/999 would over-round the taller expanded card; fixed 2026-06-19), `elevation.sheet`,
> 16px margins) with a top **scrim** (`LinearGradient` transparent→bg) that fades
> scrolling content underneath. Props: `total`, `oldTotal`, `totalLabel`, `cta`, `onCtaPress`,
> `ctaDisabled/Loading`, `summary:{title,rows,total}`, controlled/uncontrolled `expanded`,
> **`safeAreaBottom` (defaults to `safeArea.bottom` = 34px, added 2026-06-19)** — the card floats 34px above
> the screen edge to clear the iOS home indicator (matches Instagram). The funnel's `FOOTER_INSET` is 130
> (was 112) to keep content clearing the now-taller footer. 6 tests.
> Enabling changes: **`PriceDetails` gained `embedded`** (flat, no card surface — for nesting); **`PageShell`
> footer now floats** over the scroll (content scrolls behind it) + `footerInset` clears the last content.
> Verified: floating margins 16 + shadow, expand reveals all breakdown rows + collapses, content clears the
> bar. Screens use it (replaced the old `FunnelFooter`). **Note:** on checkout the in-page Payment Summary
> now duplicates the footer's — decide whether to drop the in-page one.
>
> **Two funnel scroll modes — clarified (2026-06-19):**
> - **Home cleaning = `PageShell pinned`** — header, aurora band and rounded card are all **fixed**; only
>   the content *inside* the card scrolls (`renderHeader` always gets `false`, no collapse). This is the
>   correct home-cleaning behaviour. Verified: card fixed at y92, inner content scrolls, header transparent
>   over the fixed band, no progress bar.
> - **Flex funnels = default (collapsing)** — band scrolls away, header collapses, card rises.
> - **The `Header` `step` 4-segment bar was a misread** — that segmented indicator is the **flex-funnel
>   carousel indicator** (swipe the header video), NOT a funnel step indicator. Removed from the
>   home-cleaning header. (`Header.step` prop still exists but is unused; repurpose as a carousel indicator
>   for flex, or remove, during DS reconciliation.)
> - **Step indicator = circular progress ring (chosen 2026-06-19 over a fraction / pill), promoted to the
>   DS as `StepIndicator`** (cross-platform: raw `<svg>` web + react-native-svg native; ring track +
>   brand arc filled `current/total` + centred step number; stories/docs/tests). `Header` gained an
>   **`aside`** slot — a ReactNode on the title row, right-aligned **after** `actions` (so the funnel's
>   heart sits to the **left** of the ring). Funnel passes `<StepIndicator current={step} total={4} />`.
> - **Full-bleed on device (2026-06-19):** `preview-head.html` declares the iOS standalone web-app tags
>   (`apple-mobile-web-app-capable`, `status-bar-style=black-translucent`) + a single canonical viewport
>   meta with `viewport-fit=cover` (a dedup script removes Storybook's default) + `html,body,#storybook-root
>   { height:100%; min-height:100dvh }`. Content runs under the status bar (status text goes white). To see
>   it on device you must **remove + re-add the home-screen icon** (iOS caches these tags at bookmark time).
>   - **Top:** Funnel `SAFE_TOP` 44→**69** (clears the Dynamic Island + breathing room; user asked twice for
>     more), `BAND_H` 116→**141** so the taller header still clears the rounded card top.
>   - **Bottom (UPDATED 2026-06-21 — full-bottom-bleed fix):** the screen `Phone` wrapper is **`position:'fixed'`**
>     (not `absolute`; RNW supports `fixed`, RN types don't → cast). Its **no-keyboard height comes from a CSS
>     cascade**, NOT from JS measurement: the wrapper carries `data-phone-frame` (via RNW `dataSet`) and sets
>     **no inline height**, so `preview-head.html`'s `[data-phone-frame]{ height:100vh; height:100dvh }` applies —
>     `100vh` is the floor for iOS < 15.4 (no `dvh`; a lone inline `100dvh` would be dropped → the fixed element
>     collapses to content height), `100dvh` is the **home-indicator-inclusive** dynamic viewport that reaches the
>     PHYSICAL bottom for full bleed under `viewport-fit=cover`. The earlier approach pinned the height to
>     **`visualViewport.height`, which EXCLUDES the home-indicator strip** on a standalone iOS app, so the wrapper
>     stopped ~34px short and the floating bar hovered with a gap ("not sitting at the bottom"). We now use the
>     measured `visualViewport.height` (+ `translateY(offsetTop)`) **only when the keyboard is up** (`keyboardUp =
>     offsetTop>1 || height < layoutH-80`) — that inline height overrides the CSS rule, keeping a sheet above the
>     keyboard. Body bg is already `#FBFAF7` (canvas) via the preview decorator (matches `CheckoutBar`'s
>     `pageBackground` fill), so any residual sub-pixel sliver blends instead of flashing white. The bar floats
>     `safeArea.bottom` (34) so the CTA clears the home indicator. **NB:** on the device this only bleeds full if
>     the home-screen icon was added AFTER `viewport-fit=cover` existed — **remove + re-add the icon** otherwise.
>     Both screen `Phone` wrappers (funnel + ThankYou) share this logic — it is currently **duplicated** (a
>     shared-component refactor is a flagged follow-up).
>   - `CheckoutBar` expanded **top corners → `radius.2xl` (24)**, same as `BottomSheet`.
>
> **Service-specific header gradients (2026-06-19):** `apps/storybook/public/header-gradient-{clean,care,
> heal,assist}.svg` — each is the same paper-base + 2-radial-glow structure, different glow colours per
> service. Home cleaning uses `…-clean` (both glows brand-blue) — reproduced token-native in the screen's
> `HeaderAurora` (`background.paper` + brand glows at 84%/95% @0.14 and 30%/25% @0.12). Other services'
> gradients are ready for their funnels. Add-on tiles now use the real CDN product images (cloudfront
> `…/attribute-contents/…webp?f=webp&w=320`). Checkout polish: tabby row slimmed (flat bordered, ~45px),
> voucher + wallet are one shared `MiniActionCard` (identical 175×72, matching `Add`/`Details` link size).
> Header fix: action icons use horizontal-only padding so an action never makes the bar taller than the
> title row (title now at the same Y on every step).
>
> **Card-selection treatment (convention):** selectable **cards** = brand outline (`border.brandDefault`)
> + **`background.selected` (#F4FEFF, "very light blue")** fill + dark text — per `CategoryCard`. Applied to
> `TabGroup` (added the selected fill) and the funnel's professional-choice cards (`ProChoice`, all one
> fixed 140×152 size). NB this differs from the small **chip/toggle** controls (numbers, Yes/No, dates,
> time slots) which stay **solid brand fill + white text**. DS reconciliation: any other selectable-card
> components should adopt the card-selection treatment.
>
> **NEXT — Flex funnels (salon etc.):** same shell but the band is a **video/media slot** (collapses on
> scroll) with the sticky category-chips row; content from `salon-ss-01/02`. User: "then we'll continue
> with flex."

---

## 15. Thank-You / booking-details screen (`screens/ThankYouScreen.tsx` — SHARED) — done

> **Now a shared frame-agnostic screen** (`packages/ui/src/screens/ThankYouScreen.tsx`), rendered by both
> Storybook (web) and Expo (native) — see §16 for the platform-hero split + the `leading` close/back prop +
> the native-swipe fix + verification. The notes below describe the original web build & the content/copy.

Adapted from Figma file **`Ma2LT3aqHJonrwVxgPHP9I`**, node **`112:1598`** ("aftercheckout-or-bookingdetails").
(To re-pull: `FIGMA_FILE_KEY` in `.env` is the OLD file — override per-call. A throwaway fetch script over
`/v1/files/<key>/nodes?ids=<id>` reading `FIGMA_TOKEN` from `.env` dumps the node tree / exact TEXT
`characters`. **Always pull the exact text** — see memory `never-change-approved-content`.)

**Reachable from the funnel (end-to-end test path):** `ThankYouScreen` is now exported from
`ThankYou.stories.tsx` (`excludeStories`-d so it stays out of the sidebar) and rendered by the Home-Cleaning
funnel: pressing **"Complete"** on step 4 (was: loop to step 1) sets `done` and shows the Thank-You screen;
its **hero back chevron** (`onBack`) resets the funnel to step 1, so the whole booking flow is loop-testable
from any funnel story. Both files are `.stories.tsx`, so the cross-import keeps `no-raw-values` off (the
screen's white/green overlay literals stay legal).

**Architecture (its own pattern, NOT PageShell):**
- `Phone` wrapper = the funnel's full-bleed visual-viewport pin (height + keyboard `offsetTop` translate).
- **Hero is pinned via `position:'sticky'`, NOT a separate fixed overlay** (`height=HERO_H=448` — Figma
  hero is 448; the rounded content section begins at `SECTION_TOP=412`, overlapping by 36, so bump both
  together). The screen is **one ordinary vertical `ScrollView`**: the hero is its first child, `position:
  sticky top:0 zIndex:0`; the content section follows with `marginTop:-(HERO_H-SECTION_TOP)` and `zIndex:1`,
  so it **scrolls up and OVER the pinned hero** (higher z). User rule satisfied: hero stays fixed, content
  scrolls over it.
- **Why sticky and NOT a covering scroll layer (don't regress to the old hack):** an earlier version put a
  full-height `ScrollView` IN FRONT of an absolute hero with a `pointerEvents:'none'` spacer. On RNW that
  fails both ways — the ScrollView's **content container** stays `pointer-events:auto` and eats the hero's
  taps/swipes, and forcing the container click-through (`box-none` → `pointer-events:none` on the scroller)
  **kills vertical scrolling entirely**. Sticky sidesteps all of it: the hero is a real in-flow element, so
  its carousel + CTAs are naturally tappable/swipeable and the page scrolls normally — **no pointerEvents on
  the ScrollView**. RNW DOES support `position:'sticky'` (cast through `as unknown as 'absolute'`). Verified:
  page scrolls (sh 1283 > ch 974), the sticky hero holds `top:0` through the scroll, content rises over it,
  hero CTAs hit-test to the buttons, the media resolves into the horizontal carousel scroller.
- **Pagination dots are a FIXED overlay, not per-slide.** The dots used to live inside each scrolling slide
  so they slid with the carousel — wrong. They're now a single absolute overlay in the hero
  (`bottom:PROMO_BOTTOM`, `pointerEvents:'none'`), with `active` driven by the carousel's `onScroll`; the
  per-slide promo reserves their strip via `paddingBottom`. Dots hold x-position while slides move; only
  `active` (the wide dot) changes.
- **Hero = a real carousel:** horizontal paging `ScrollView`, **each slide is its own promo** (media +
  discount `Badge` + headline + CTAs + dots), **auto-advances every 3s** and is swipeable. Slide 1 = the
  approved promo; **slides 2-4 are GREEN media + placeholder promos** (Figma only specified slide 1).
  Hero CTAs are a screen-local `HeroButton` (white label over media; `size.6`/`size.20` padding — the
  user iterated the size twice: not 2xs-tiny, not big).
- **Rounded content section sits OVER the hero** (`borderTopRadius 2xl`, `background.canvas`), and the
  **confirmation `ThankYouCard` is offset up over the section's top edge** (`marginTop: -t.size['48']`,
  NO shadow). The section's corners + green hero are visible around the card top — this exact look was a
  hard back-and-forth; don't detach the card or drop the section radius.
- Content: `ThankYouCard` (category-`'clean'` avatar + photo, "★ 4.7 (12)") → `InfoCard tone="accent"`
  tip → `ActionRow`s (Pay Pending Amount [badge], Edit this booking only) → `BookingSummary` → `PriceDetails`.

**`ThankYouCard` changes made (it is an approved component — be careful):** the professional block now
renders **avatar → name → "★ rating (reviewCount)" line** (was a rating badge over the avatar) to match
the Figma; added optional `reviewCount`; in-card action buttons use a recessed grey fill (`background.tertiary`)
because the old white `pill` vanished on the now-white card.

**Audit (multi-agent) fixes applied:** discount chip → DS `Badge` (`tone="rating" icon="tag"`, centered via
`alignSelf:'center'`); grey rows unified to `radius.default` (`PriceDetails` footer was `radius.md`); tip →
`InfoCard tone="accent"` (very-light-blue, NOT grey — grey read as clickable); `CARD_OFFSET` magic number → token.

**Open / deferred (ask before changing):** the Figma card also has a "MONDAY 13:00-14:00" date row (not in
the screenshot → omitted); generic "List item" placeholder rows + a "Cash (+5 AED)" alt-payment (omitted);
slides 2-4 promos are placeholders.

---

## 16. Native preview app — `apps/prototype` (Expo SDK 54) — NEW 2026-06-21

On-device testing target. Storybook (RNW in a browser) was great for building the catalog, but the device
fidelity issues (full-bleed, safe areas, keyboard) are exactly where RNW-in-a-PWA diverges from native — so
the funnel's floating bottom bar "wouldn't sit at the bottom" no matter how many `100dvh`/`visualViewport`
hacks we layered. **`apps/prototype` runs the real components on real React Native via Expo**, where
`useSafeAreaInsets().bottom` gives the true home-indicator inset and the bar just sits correctly with ZERO
hacks (verified in the iOS Simulator). The component library (`@justlife/ui`) runs natively unchanged — the
architecture bet. **Fast Refresh ~1s** (faster than Storybook), addressing the iteration-speed concern.

- **Expo SDK 54** (React 19 / RN 0.81) — NOT 52: Expo Go on a **physical** iOS device only supports the
  LATEST SDK, so the project must track it. (Simulator can run any SDK; the device can't.) The bump is
  **contained to the app** — Storybook + `@justlife/ui` stay on React 18 (untouched, still 49 files/192 tests
  green). See memory `expo-prototype-app` for the full setup.
- **Monorepo Metro gotchas (`apps/prototype/metro.config.js`):** a custom `resolver.resolveRequest` forces
  single instances of `react`/`react-native`/`react-native-svg`/`react-native-safe-area-context` to the app's
  copies for EVERY importer — otherwise `@justlife/ui` (source in `packages/ui`, whose node_modules pin React
  18/RN 0.76) makes the bundle mix versions → `PlatformConstants`/`RNSVGLinearGradient` "not found in native
  binary" or invalid hook calls. `extraNodeModules` alone is insufficient (only fills FAILED resolutions).
- **`@types/react` pinned to `^18` via root `pnpm.overrides`** so React 19 in the app doesn't unify the
  `@types/react` peer to 19 and break `@justlife/ui`'s typecheck. Runtime unaffected.
- **Run:** `export PATH="$HOME/.local/bin:$PATH" && cd apps/prototype && npx expo start` (NOT `CI=1` — it
  disables Fast Refresh). Sim: install the matching Expo Go (`api.expo.dev/v2/versions/latest` →
  `sdkVersions["54.0.0"].iosClientUrl` → github expo-go-releases tarball → wrap as `.app` → `xcrun simctl
  install booted`), then `xcrun simctl openurl booted exp://127.0.0.1:8081`. **Device:** LAN failed
  ("Could not connect" — iOS Local-Network permission / VPN), so use **`npx expo start --tunnel`** (pre-install
  `@expo/ngrok`); scan the `exp://<sub>.exp.direct` URL with the iOS **Camera** (newer Expo Go hid manual URL
  entry). The tunnel subdomain is stable per session, so an existing QR keeps working after a restart.
- **Poppins on native (DS fix):** `typographyToStyle` used to drop `fontFamily` on native (system-font
  fallback → text looked small/wrong). Now it maps the weight → a named Poppins face
  (`Poppins-Regular/Medium/SemiBold`); the app loads those via `expo-font` + `@expo-google-fonts/poppins`,
  gating render on `useFonts`. Web branch unchanged. (192 tests still green.)
- **Screens built (all native, verified in sim):** `App.tsx` = a mock **homepage** (greeting, search,
  category tiles, promo, popular-service cards, recently-viewed) + the floating **`BottomNavigation`** (tabs
  switch screens, badge, shrink-on-scroll) on the real bottom inset. Tapping the **Home Cleaning** card opens
  the funnel; route state in `App.tsx` is home → funnel → thankyou.
- **SHARED funnel (one source of truth):** `packages/ui/src/screens/HomeCleaningFunnelScreen.tsx` is a
  frame-agnostic composition (props `safeAreaTop`/`safeAreaBottom`/`onExit`/`onComplete`), exported from the ui
  index. Storybook's `HomeCleaningFunnel.stories.tsx` (thin: `Phone` + fixed insets 69/safeArea.bottom) and the
  Expo `apps/prototype/screens/HomeCleaningFunnel.tsx` (thin: `SafeAreaView` + real insets) both render it →
  no web/native drift. `packages/ui/src/screens/**` added to the `no-raw-values` lint-off list (screens use
  placeholder/overlay raw values). ui index ↔ screen import is circular but safe (components used only inside
  render fns). The user demanded this after the native funnel was first hand-rolled and diverged.
- **SHARED Thank-You (one source of truth) — DONE 2026-06-21:** `packages/ui/src/screens/ThankYouScreen.tsx`
  is now the frame-agnostic composition (props `safeAreaTop`/`safeAreaBottom`/`leading`/`onLeadingPress`),
  exported from the ui index. Storybook's `ThankYou.stories.tsx` (thin: `Phone` + insets 54/safeArea.bottom,
  `Confirmed` = close + `BookingDetails` = back stories) and the Expo `apps/prototype/screens/ThankYou.tsx`
  (thin: real insets) both render it → no web/native drift. The hero CHROME (carousel + overlays) and the
  CONTENT (cards) are shared components; only the PIN scaffold branches on `Platform.OS`:
  - **Web** — one `ScrollView`, hero pinned with CSS `position: sticky` (unchanged, still works).
  - **Native** — one `Animated.ScrollView`; the hero is a real IN-FLOW child counter-translated by the scroll
    offset (`transform: translateY(scrollY)`, `useNativeDriver`). Keeping the hero in-flow makes its nested
    horizontal carousel get manual swipes natively. **This fixed the broken native swipe** (the old build
    floated the hero behind a vertical-`ScrollView` overlay whose pan recogniser ate the horizontal gesture;
    `pointerEvents:none` on the spacer didn't help because iOS `UIScrollView` still hit-tests to itself).
- **Hero leading control is a PROP** (`leading: 'close' | 'back'` + `onLeadingPress`): Thank-You passes
  `close` (`x` icon → home), and the SAME screen reused for **Booking Details** passes `back` (chevron-left).

**VERIFIED 2026-06-21:** web Storybook (`Confirmed` shows `x`, `BookingDetails` shows `chevron-left`, hero
pinned, content scrolls over) + iOS Simulator (manual carousel swipe works BOTH directions — proven with
auto-advance temporarily disabled: forward 1→2, backward 2→1; X close shown; pro photo loads). typecheck ✓ ·
lint ✓ · 192 tests ✓. The whole Home-Cleaning funnel → Complete → Thank-You loop runs natively.

---

## 17. Liquid Glass — `GlassSurface` primitive (NEW 2026-06-22)

The **`BottomNavigation`** and **`CheckoutBar`** float as **Apple Liquid Glass**. Built as a reusable
primitive `packages/ui/src/primitives/GlassSurface/` (full detail + the hard-won pitfalls in memory
`liquid-glass-glasssurface`). Three render paths (repo platform-suffix convention):
- **iOS 26+** → `expo-glass-effect` **`GlassView`** = real Apple Liquid Glass (blur + lensing + specular
  rim). Gated by `isGlassEffectAPIAvailable() && isLiquidGlassAvailable()`; **bundled in Expo Go SDK 54** so
  it renders with no dev build. User confirmed it looks right on a physical iOS 26 iPhone.
- **iOS < 26 / Android** → `expo-blur` `BlurView` frosted fallback. **web** → CSS `backdrop-filter`.
- **Reduce Transparency** → opaque `background.surfaceRaised`.

**Props:** `radius`, `tint: 'regular'|'strong'`, `noShadow`, `style`, `children`. Use as a wrapping container
OR an absolute-fill background layer (`style={StyleSheet.absoluteFill}`).

**Tokens (added):** `glass.{tint,tintStrong,border,highlight,blur,intensity}` (light+dark). Tints capped
≤0.18 white — higher washes to solid white.

**Setup:** `expo-glass-effect` + `expo-blur` in `apps/prototype` deps + metro `FORCE_SINGLE`; ambient
`.d.ts` shims in `packages/ui/src/types/` (ui is consumed as TS source; web/tests use `.web.tsx`).

**Hard rules that defeated the "solid white" regression (do not undo):** (1) never paint a near-opaque fill
OVER the blur — tint goes in as native `tintColor`, capped ≤0.18; (2) no manual edge/highlight overlays on
the GlassView path (they flatten the native material — kept only on the blur fallback); (3) a glass bar must
let content scroll BEHIND it (no solid `pageBackground` band/scrim — removed from CheckoutBar); (4) iOS
`overflow:'hidden'` clips the shadow → two layers (outer = shadow, inner = clip); (5) **never judge glass over
flat white** (invisible by physics) and **the iOS Simulator renders it flat** — verify the real look on a
physical iOS 26 device. Proof story: `Primitives/GlassSurface → "Proof · over busy"` (rainbow stripes must
read blurred/refracted through the bar).

---

## 18. Native screen photos & shared image assets (NEW 2026-06-22)

The Expo app screens now use the REAL DS components + real photos (matching the Storybook drafts), not
hand-rolled placeholders:
- **Homepage** (`apps/prototype/App.tsx`): categories use the real `CategoryShape` brand shapes (the 4
  verticals clean/care/heal/assist); popular-services + recently-viewed use real photos.
- **Funnel pro choices**: 4 **distinct** people (were all one pravatar) + a returning-customer line
  **"Served you on" / "{date}"** (date forced to the 2nd line) shown only when a pro has `servedOn`. Cards
  are content-driven height, equalized by the row (`alignItems:'stretch'`) — no fixed-height magic number
  (equal-size-rows).
- **Thank-You pro photo**: the approved brand photo `profilepic_clean.png`.

**Shared image assets — bundle in the DS, not `public/`:** approved photos live in
`packages/ui/src/assets/*.png` and are imported (`import pic from '../assets/x.png'`) so BOTH bundlers emit
them. **Cross-bundler gotcha:** Vite (Storybook web) resolves the import to a **string URL**; Metro (Expo)
resolves it to a **numeric asset id**. `Image.resolveAssetSource` exists on native but **NOT on RNW** (it
threw `Image.resolveAssetSource is not a function`). Normalise with:
`const uri = typeof pic === 'string' ? pic : Image.resolveAssetSource(pic).uri;`. TS: add a `*.png` module
decl (`packages/ui/src/types/assets.d.ts`). vitest + Vite both handle the png import (tests stay green).

**Photo-source caveats (asset gaps, not bugs):** the DS owns only ONE cleaning-specific brand photo (on
Thank-You); the other brand verticals read as the wrong job for a cleaning funnel (one is a doctor), so the
4 funnel choices use distinct **neutral stock people** (pravatar) until real cleaning-pro photos exist. The
homepage uses **loremflickr** (keyword+lock, deterministic) because **picsum — the drafts' `PlaceholderImage`
source — was down**; relevance is loose. Swap both for real assets when supplied.

---

## 20. Funnel animations (NEW 2026-06-22)

Six motion additions, all token-driven (`motion.duration/easing`) and **cross-platform** via RN `Animated`
(works in Storybook RNW + Expo native — no native-only libs). Two new primitives back them:
- **`Collapsible`** (`primitives/Collapsible`) — height + fade reveal. Mounts on `open`, measures content,
  animates a single `progress` (height `0↔content`, opacity `0↔1`); on close it animates out **then
  unmounts** (collapsed content leaves the tree → a11y-clean, no hit-testing).
- **`Confetti`** (`primitives/Confetti`) — token-coloured burst of `Animated` pieces (transform+opacity).
  `origin="bottom"` showers up the screen; `origin="center"` is a contained pop. Sizes from `Dimensions`
  (no layout measurement → fires immediately), `pointerEvents="none"`, `runKey` re-fires it.

The six:
1. **BottomSheet** slides up + scrim fades (and reverses on close). It's now an **`open`-lifecycle**
   component (animate-in on mount, animate-out → unmount on `open=false`), so EVERY close path (scrim, X,
   Save/Apply) slides down. Funnel sheets are now **always mounted** with `open={state}` (+ a re-sync
   `useEffect` so inputs show the saved value on reopen). **Keyboard avoidance:** the sheet listens to
   `keyboardWillShow/Hide` (iOS) / `keyboardDidShow/Hide` (Android) and **grows its bottom padding** to
   `safeArea.bottom + keyboardHeight` (matching the keyboard's duration), so the focused input (voucher code,
   special instructions) rises above the keyboard. Padding (not a translate) keeps the white, bottom-anchored
   sheet glued to the screen bottom — so nothing else (page colour / scrim) shows below it. Because padding is
   a layout prop the whole sheet uses the **JS driver** (`useNativeDriver:false`) to avoid mixing drivers on
   one view, and `onLayout` measures the slide height **once** (the animated padding would otherwise re-fire
   it each frame). Native-only — no-op on web, so it can't be seen in the preview.
2. **Footer morph** — the funnel footer is now **persistent** (rendered OUTSIDE the per-step `key`ed
   PageShell, as an absolute-bottom sibling). `CheckoutBar` gained a **`priced`** prop: `false` = full-width
   CTA + no price (Frequency step), `true` = total + compact CTA. Flipping it animates a `morph` value
   (price `flexGrow`+opacity in, CTA `flexGrow` 1→0 = squeezes right). **When `!priced` the glass card +
   shadow are NOT rendered** — the unpriced footer is JUST the floating CTA, so the page scrolls past it
   cleanly (no solid/glass panel behind the button — the recurring "fixed solid behind the bar" bug). The
   glass backing only exists on priced steps. _(Next→Complete label still swaps instantly — small TODO.)_
3. **Recurring card expansion** uses `Collapsible` (open = recurring selected).
4. **Payment summary** in `CheckoutBar` uses `Collapsible` (expands bottom-up). The bar's pill ↔ sheet
   corner radii must **trail the height**: switching to `radius.pill` (999) the instant you collapse —
   while the bar is still tall — gets clamped to height/2 = a content-masking half-circle. So the corners
   stay 2xl/size.32 during the collapse and flip to pill only after `motion.duration.medium` (bar now short,
   pill ≈ half-height → no visible jump). **Native `Collapsible` gotcha:** measure the content via an
   **absolutely-positioned** wrapper — an in-flow child reports the clamped 0 height on native and the panel
   never expands (web measured it fine, so the preview missed it).
5. **Thank-You confetti** — `<Confetti origin="bottom" count={36}/>` overlay, fires on arrival.
6. **Voucher confetti** — `<Confetti origin="center" count={16} runKey={code}/>` inside `AppliedVoucherCard`.

**⚠️ Verification gotcha — the headless preview starves `requestAnimationFrame`** (a rAF loop never ticks;
confirmed). So RN `Animated` (JS-driver) values never move in Storybook's preview — you can verify **end
states + structure** but NOT the smooth motion there (it runs fine on a real browser + device). Mitigation:
every animation has a **`setTimeout` settle** that snaps the value to its end state after `duration+~60ms`,
so end states are deterministic in the preview AND robust to background-tab/low-power throttling. Also note
**`preview_click` does NOT trigger RN-Web `Pressable`** — dispatch a real `pointerdown`+`pointerup` sequence
instead. **Motion itself should be device-verified** (Expo) — not yet done this pass.

**Haptics (rule, 2026-06-22):** the **QuantityStepper** fires a light haptic on every press (add · increase ·
decrease · remove) via `hapticTap()` (`packages/ui/src/lib/haptics.ts` → `expo-haptics`
`impactAsync(Light)`, fire-and-forget; `haptics.web.ts` is a no-op). Ambient types in
`src/types/expo-haptics.d.ts` (same pattern as expo-blur/expo-glass-effect); `expo-haptics ~15.0.8` is an
`apps/prototype` dep. **Reuse `hapticTap()` for new tactile controls.** Device-only (can't verify in the
preview). Adding a native module needs a **Metro restart** (source edits hot-reload, new deps don't).

---

## 19. Frequency step — new Home-Cleaning funnel step 1 (NEW 2026-06-22)

The Home-Cleaning funnel is now **5 steps**: a new **Frequency** selection is inserted as **step 1**; the old
1–4 shifted to **2–5** (Home Cleaning · Popular Add-ons · Date & Time · Checkout). All in the SHARED
`packages/ui/src/screens/HomeCleaningFunnelScreen.tsx` (web + native, no drift). Source design = the OLD-app
Figma `5oelNRfOhuxiQKNGZmuOHo`, page "Frequency Step" (frames `42:2183` collapsed, `42:2253` expanded) —
**content reproduced verbatim, redesigned in our DS** (our `Header`/`PageShell`/`Radio`/`Badge`/tokens, not
the old chrome).

**Layout (local helpers in the screen file):**
- 3 plan cards (`FrequencyCard` — a vertical selectable card: title + optional discount `Badge` + `Radio`
  top-right, divider, benefit `Bullet`s, optional expansion). Selected = `background.selected` + brand
  border + filled radio (the shared selected-card treatment). The "Most Popular" ribbon is a `Badge`
  tone="brand" absolutely positioned over the top-left border.
  - **One Time** — "Perfect pick for an uncertain schedule."
  - **Recurring** (Most Popular, "Up to 25% off") — bullets + the expansion.
  - **Monthly Subscription** ("Up to 40% off").
- **Recurring expansion** (`RecurringExpansion`, only when recurring is selected): a cadence toggle
  (reuses the funnel `Pills` — Weekly / Every Two Weeks, default **Weekly**), a **weekday picker** (7
  circular `Selectable`s M T W T F S S — `Selectable` gained an optional `radius` prop → `radius.pill`;
  **multi-select, none preselected**), and a live **discount banner** (`background.promo.subtle` +
  `text.promoDark`, centered) shown once ≥1 day is chosen. Discount scales: `min(25, 7 + 3·days)` → 2 days
  = 13%, capped 25% (matches the figma's "earned 13%… up to 25%").
- **`JustlifePromise`** block pinned to the **bottom** of the scroll area (a `flex:1` spacer pushes it
  down; `PageShell` gained an opt-in **`contentGrow`** prop that adds `flexGrow:1` to the pinned scroll
  content so a trailing element can sit at the bottom — content still scrolls when Recurring expands). Its
  two points adapt: recurring → "Same Professional Guaranteed" + "Pause or Cancel Anytime"; otherwise →
  "More Days, More Savings!" + "Reschedule or Cancel Anytime". ("justlife" wordmark = brand-cyan text, not
  a logo asset.)

**Footer / gating:** the frequency step has **no price yet**, so its footer is a plain full-width pill CTA
(`ContinueBar`, opaque `background.canvas` band) — NOT the `CheckoutBar`. `StepConfig` gained
`footerKind: 'cta' | 'checkout'` + made `oldTotal`/`total` optional. The CTA is **disabled until valid**:
One-Time/Monthly = valid on tap; Recurring also needs ≥1 weekday. Frequency state (`frequency`/`cadence`/
`days`) is **lifted to `HomeCleaningFunnelScreen`** so the footer can gate on it and it survives the
per-step `key={step}` remount. The **heart** (favourite) moved to step 2 (Home Cleaning).

**Verified on web** (Storybook `Screens/Home Cleaning Funnel` → `1 · Frequency`): collapsed matches `42:2183`;
selecting Recurring expands + swaps the Promise + enables nothing until days; Wed+Sat → 13% banner + gold CTA
enabled; Next → step 2 (heart + "2/5" ring + CheckoutBar). typecheck ✓ · lint ✓ · 192 tests ✓. Native shares
the same file (all RN-standard primitives; not separately device-verified this pass).

**Open judgment calls (flagged to user):** (1) CTA label = **"Next"** for funnel consistency (figma said
"Continue"). (2) discount `Badge` uses the DS **`success` tone (lime `#BBFF33`)** — visibly punchier than the
old app's soft sage green; it's the DS token (swap if the user wants a softer green added to the system).

---

### (history) Header + PageShell build

> **Slice 1 — compact `Header` — BUILT & VERIFIED (2026-06-19).** User picked the **"inline title +
> 4-segment progress bar"** direction (of 3 offered). `packages/ui/src/components/Header/` — a single
> title row (back chevron + `titleMedium` title + trailing action icons + optional circular country-flag
> slot) with a slim segmented step-progress bar under the title; `collapsed` scroll-collapses it (bar
> folds to height/opacity 0, padding tightens) via the `motion` tokens, mirroring `BottomNavigation`.
> Props: `title`, `step:{current,total}`, `showBack`/`onBack`, `actions:HeaderAction[]` (icon +
> a11yLabel + `tone:'default'|'danger'|'brand'` + `filled`), `flag` (ReactNode slot) + `onFlagPress`,
> `collapsed`, `divider`, `titleVariant`. The country flag is a **slot** (asset-free): the story builds a
> UAE flag from the `icon.flagGreen/flagWhite/flagRed` + `base.black` tokens. 6 stories, 7 tests.
> Verified in-browser: 4 segments (1st `#00C3FF`, rest `#DDDDDD`), title Poppins 16/600, collapsed bar
> height 0, flag 32px circle from tokens. typecheck ✓ · lint ✓.
>
> **Slice 2 — `PageShell` (the layered depth) — BUILT & VERIFIED (2026-06-19).**
> `packages/ui/src/components/PageShell/`. A soft-gradient band sits behind (`z −2`) a rounded-top content
> card (`z 0`) that overlaps up into it; scroll is **built in** (user's choice) — the band fades +
> parallaxes, the header scroll-collapses past a threshold (drives `Header`'s `collapsed`), and an optional
> `stickyRow` (category chips) pins under the header. Props: `renderHeader:(collapsed)=>node`, `bandColors`
> (gradient stops, top→bottom, via the `LinearGradient` primitive), `bandHeight`, `bandContent` (tagline /
> media slot), `stickyRow`, `cardRadius` (default `radius.2xl` 24), `overlap` (default `size.24`),
> `headerHeight`, `collapseThreshold`, `onCollapsedChange`. 2 stories (HomeCleaningFunnel, SalonFlex), 5
> tests. Verified in-browser: band `#B3EEFF→#FFFFFF` behind card (card top y156 over a 180 band, radius 24),
> header floats at top, scrolling past the threshold folds the header progress bar (collapse confirmed).
> Band fade/parallax is rAF-driven → not filmable in the headless preview (same caveat as BottomNavigation),
> but the threshold-collapse is confirmed. typecheck ✓ · lint ✓.
>
> **Gradient — RESOLVED, token-native (2026-06-19).** The user supplied `header-gradient.svg` (in
> `apps/storybook/public/`): a soft radial "aurora" — warm paper base `#F4F4EF`, a brand-blue glow
> top-left (`#00C3FF` @ 12%) and a coral glow bottom-right (`#FF7272` = `color.red.400` @ 14%), each
> fading out. User chose the **token-native** route, so:
> - **New token** `background.paper = #F4F4EF` (light) / `#232424` (dark) — added to `themes/{light,dark}.json`,
>   tokens rebuilt. (A token is a system-level decision; the user explicitly approved it.)
> - **New primitive** `RadialGlow` (`packages/ui/src/primitives/RadialGlow/`) — `baseColor` + positioned
>   `glows[]` (`{color,x,y,opacity,radius}`), web via stacked CSS `radial-gradient`, native via
>   react-native-svg (mirrors `LinearGradient`). Exposes `hexToRgba`. 5 tests.
> - **`PageShell` band is now a `band` slot** (was `bandColors`) — the stories pass a token-built
>   `HeaderAurora` (`<RadialGlow baseColor={background.paper} glows={[brand@30%/25%, red.400@84%/95%]}/>`).
>   Verified in-browser: band base `#F4F4EF`, the two radial glows at the right positions/opacities.
>   `header-gradient.svg` stays as the design reference only.

**Original brief (Header) — build a `Header` for the **home-cleaning booking funnel** (where the header is used today) and
design the **layered/"depth" page architecture** the funnels share. The **homepage is being redesigned**,
so the new header must be **more compact** but keep the **same elements** as today's.

**Header elements to keep** (from Figma `Header`, node `12436:10918` — a *single* component; props
`Edit Title` / `Show Icon` = back chevron / `Show Country Selection` = flag):
- Back chevron (`chevron-left`, 24, `icon.primary`); Title (`titleSmall` 13/18, `text.primary`);
  Country/flag selector (32px circle + hairline border) — **the flag is a custom asset → park/extract**.
- In the flex-funnel screenshots the header also carries **search + favourite (heart)** icons over the
  media plus a tagline caption.

**Layered "depth" architecture (the core idea the user described):**
- The **header sits BEHIND the page** — conceptually `header z-index = -2`, page content `z-index = 0`.
  The page content is a **round-cornered card** that overlaps / slides up over the header area (rounded
  top corners). **This round-cornered card structure is consistent across funnels and important.**
- The media/header area behind the card can be **a video** (flex funnels, e.g. salon) that **vanishes /
  collapses on scroll-up**, OR **a gradient/solid colour** (e.g. at checkout) — same collapsed area.
- So the Header is **scroll-collapsing** — same approach as `BottomNavigation`'s shrink-on-scroll (drive
  from scroll offset, animate via `motion` tokens). Collapsed ≈ a compact bar (`‹ Title` + right icons),
  and in salon a **sticky category-chips row** pins to the top of the content card.

**Reference screenshots** (`apps/storybook/public/screenshots/`):
- `IMG_0224 / 0226 / 0227 / 0228 / 0229.PNG` — **home-cleaning booking funnel** steps (current header).
- `salon-ss-01.png` — flex funnel **expanded**: video header (back + search + heart + tagline), content
  card slides up (Step 1 of 4, "Women's Salon", rating, category grid, bestsellers).
- `salon-ss-02.png` — flex funnel **scrolled/collapsed**: compact `‹ Women's Salon` bar + search/heart +
  sticky chips row; video gone.
- `collapsed-header-example.png` — the collapsed concept: colour area behind + round-cornered content card
  with the category-chips row at its top.

Screenshots are the **OLD app / reference** (content, structure, states) — rebuild with NEW DS tokens;
show missing/asset parts GREEN (memory: `screenshot-to-ds-green-placeholders`).

**Likely new pieces:** a compact `Header` (back / title / flag / action slots, scroll-collapsible) **and**
a **page-shell layout** (media-or-colour header behind a rounded-top content card). Video + flag are
assets → slots/parked. Reuse `motion.duration.*` + `Easing.bezier(...motion.easing.standard)` for the
collapse. Propose the API to the user before building.
