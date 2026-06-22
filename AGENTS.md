# AGENTS.md — Justlife Design System

Operating rules for **anyone (or any AI tool) building in this repo** — Claude Code, Cursor, Copilot,
a teammate, whoever. Tool-agnostic on purpose. **Read this before creating or changing anything.**

- Formal policy & approval flow → [`docs/governance.md`](docs/governance.md)
- Day-to-day commands & setup → [`docs/contributing.md`](docs/contributing.md)
- Cross-platform (RN / RNW) rules → [`docs/platform-rules.md`](docs/platform-rules.md)
- Current build state / where to resume → [`docs/HANDOFF.md`](docs/HANDOFF.md)

This is a **code-first** design system: code is the source of truth, Figma is reference. Mobile-first
(React Native + react-native-web), every visual value comes from `@justlife/tokens`.

---

## The three non-negotiables

1. **Reuse before creation.** Audit existing components → patterns → tokens → variants before adding
   anything new. The smallest addition that fits the system wins.
2. **Tokens only.** No raw colours or dimensions in component/pattern code — ever. Use `useTheme()`.
3. **Everything is documented & tested.** Each component ships stories, MDX docs, and tests.

## Never invent — ask first

This is a **company** design system. Do **not** invent tokens, colours, assets, icons, or components
on your own. If something seems missing, surface it and ask. Adding a token is a **system-level
decision** (justify in the PR, place in the right tier, get CODEOWNERS approval — see governance).
The one historical carve-out (motion tokens) was explicitly authorised; treat it as the exception,
not the pattern.

---

## Design conventions

The accumulated, reusable rules. **Enforcement** says how the rule holds today — `Enforced` means a
token/default/lint/test makes it automatic; `Convention` means you must apply it by judgment (and it's
a candidate to graduate into code — see the ladder below).

| # | Rule | Why | Enforcement |
|---|------|-----|-------------|
| 1 | **Every visual value comes from a token** (`useTheme()` → `t.*`). No raw hex / rgb / dimension literals. | System integrity; theming. | **Enforced** — `justlife/no-raw-values` ESLint rule. |
| 2 | **Text uses Poppins via typography tokens** (`t.typography.*` / `<Text variant=…>`), never ad-hoc font sizes/weights. | One type system. | **Enforced** (colour/dimension lint) + Convention (variant choice). |
| 3 | **Defaults:** corner radius **12** (`radius.default`), horizontal spacing **8** (`space.default`), stroke **0.5** (`borderWidth.hairline`). | Consistency baseline. | **Enforced** — baked into token values. |
| 4 | **Off-scale spacing snaps to the nearest `space` step** (e.g. Figma 12→`sm`/8 region, 6→`xs`). Don't add a token for a one-off gap. | Avoid token proliferation. | Convention (lint blocks raw numbers; "snap" is judgment). |
| 5 | **Bottom-anchored bars clear the iOS home indicator** — `CheckoutBar` / `BottomNavigation` sit `safeArea.bottom` (34px) above the screen edge. Anchor the bar flush to `bottom: 0` and let the component supply the inset. | Matches iOS / Instagram; avoids clipping. | **Enforced** — `safeArea.bottom` token + component default. Convention when hand-placing a new bar. |
| 6 | **Keep a component's shape consistent across its states.** A state change must not alter geometry the user reads as "the same element" — e.g. the expanded `CheckoutBar` keeps the collapsed bar's bottom-corner curvature. | Avoids jarring transitions. | Convention (candidate: visual-regression test). |
| 7 | **In-card action CTAs use `Button size="xs"`** (~22px), never `sm`/`md`. | Big in-card buttons read as wrong. | Convention. |
| 8 | **Two selection treatments:** *chips/segments* → solid brand fill + `onBrand` text; *cards & `TabGroup`* → `#00C3FF` outline + `background.selected` light-blue fill. | One selected-state language. | Convention. |
| 9 | **Mobile-first.** Stories render in a 375px phone frame by default; full screens opt out with `layout: 'fullscreen'`. Screen demos must **fill the viewport** (absolute inset:0), not a fixed height, so bars reach the real device edge. | Real mobile sizing. | **Enforced** (preview decorator default) + Convention (fill-viewport for screens). |
| 10 | **Don't dress static info as interactive.** Solid-brand fills, button/pill shapes and "selected" styling are reserved for live, tappable choices. Informative values (a chosen plan, a summary field) are plain text — optionally a small icon or muted `Badge` — never a CTA-sized pill. | Affordance must match behaviour; avoids fake buttons. | Convention. |
| 11 | **Self-check every build:** corner radius, spacing, and font-size accuracy/consistency — before handing off, not after the user flags it. | Quality bar. | Convention (process). |
| 12 | **A page's top inset depends on its first item.** If the first item is a **card**, its top gap equals the page's left/right padding (`space.md`) so the inset reads even on all sides. If the first item is **text** (a heading/label), give it more room (`space.lg`) under the rounded card top. | Even framing for cards; breathing room for text. | Convention (`PageShell contentInsetTop`). |
| 13 | **Equal-size rows/items — HARD RULE.** Repeated rows in a table, list, or any "kinda design" with stacked items must all be the **same height** (fixed/`minHeight` + vertically-centred content), regardless of how much each one's text wraps. Never let one row be taller than its neighbours. | Rhythm; the user enforces this strictly. | Convention (set a shared row height). |
| 14 | **Reference/informational content stays neutral — don't colour to nudge.** A policy, fee schedule, or any read-only reference is plain neutral text — no green/amber/red severity coding that could read as steering a choice (e.g. a cancellation-fee table must not look like it's encouraging cancellation). Reserve tone colours for genuine status/feedback. Keep disclaimers/containers low-emphasis (`background.tertiary`), not loud tints. | Don't editorialise neutral info. | Convention. |
| 15 | **Consistent scroll — IMPORTANT RULE.** Every screen scrolls the same way: the **inner content area owns the scroll**, the page frame never rubber-bands. A screen whose content fits must stay put — not bounce the whole page — exactly like one whose content overflows and scrolls. Lock the document against the iOS overscroll bounce (`overscroll-behavior: none` on `html, body`, in `preview-head.html`); pinned screens scroll inside `PageShell`'s content `ScrollView`, never the body. | Pages felt different (short ones bounced the frame, long ones scrolled); the user flagged this as important. | **Enforced** — `overscroll-behavior: none` globally. |

When you add or change a component, also follow the **full state matrix** (default · hover[web] ·
pressed · focused · disabled · loading · error/success), a11y props, and the colocated
`*.tsx` / `index.ts` / `*.stories.tsx` / `*.docs.mdx` / `*.test.tsx` layout. Export from
`packages/ui/src/index.ts`.

---

## Surface elevation

**`#FFF` (white) = raised; `#FBFAF7` = recessed.** That single rule drives every background:

| Level | Token | Light | Used for |
|---|---|---|---|
| Canvas (page base) | `background.canvas` | `#FBFAF7` | the screen / `PageShell` surface |
| Raised (cards on the page) | `background.surface` | `#FFFFFF` | cards, panels sitting on the canvas |
| Overlay (modals) | `background.surface-raised` | `#FFFFFF` | `BottomSheet` and other modal surfaces |
| Recessed (nested fills) | `background.secondary` | `#FBFAF7` | fills **inside** a white surface — cards inside a sheet, the close-circle, `NoteChip`, input fields |

So a card is **white on the canvas**, but **`#FBFAF7` when nested inside a white surface** (e.g. the same `PaymentMethodCard` is white on the checkout page, recessed inside the change-payment sheet — via its `recessed` prop). Don't hardcode page white; use `background.canvas` for screens so a screen can still opt into a white base later if a design calls for it. (Inverted 2026-06-19 from the old white-page model.)

---

## Enforcing rules in code (the ladder)

Conventions are not meant to stay conventions forever — graduate them down this ladder as we go:

1. **Tokens / component defaults** — strongest; the rule is just *true* and can't be forgotten
   (e.g. `safeArea.bottom`, the default radius/spacing).
2. **Custom ESLint rules** — `tools/eslint-plugin-justlife/index.js` (wired in `eslint.config.mjs`).
   `no-raw-values` lives here; new rules (e.g. "a floating bottom bar must use `safeArea`",
   "no numeric spacing literal outside the scale") are added the same way and gated in CI.
3. **Tests** — unit + a11y today (Vitest + RNTL + jest-axe). Visual-regression (Chromatic /
   Storybook test-runner) is the path for shape/spacing drift like rule #6.
4. **CI gates** — `typecheck · lint · test · build` block merges that violate the above.

So: **yes, any convention here can become code-enforced.** When you implement a rule structurally,
move its row to `Enforced` and note the mechanism.

---

## Before you finish

Run the verification recipe (see `docs/contributing.md` / `HANDOFF.md`): `pnpm --filter @justlife/ui
typecheck`, `pnpm lint`, `pnpm --filter @justlife/ui test`, and verify visually in Storybook. Report
results honestly — if something's a convention you applied by judgment, say so.
