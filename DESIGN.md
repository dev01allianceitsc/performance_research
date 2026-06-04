## Overview

Zapier is the original "connect your apps" workflow automation platform — and the marketing surface today reads as confidently-mature. The brand pairs a warm-cream canvas `{colors.canvas}` (`#fffefb`) with a deep coffee-ink `{colors.ink}` (`#201515`) and a single saturated orange `{colors.primary}` (`#ff4f00`) CTA. The warmth in the neutrals — slightly cream rather than pure white — is the brand's defining temperature signal.

Type carries the second voice. The proprietary `Degular Display` family carries hero displays at weight 500. The brand uses `Inter` for everything else — sub-displays, body, button, eyebrow. The two-face pairing reads as "the brand has its own typeface for the loud moments and uses the workhorse for the rest" — modest and unflashy.

Cards are universally `{rounded.md}` 12 px. Buttons share the same 12 px radius — not pills, not square. The brand sits between the friendly-rounded and the technical-square camps with a deliberate middle position.

**Key Characteristics:**
- A single primary CTA color `{colors.primary}` (`#ff4f00`) — saturated orange. The brand's conversion signature.
- Warm-cream canvas `{colors.canvas}` (`#fffefb`) — not pure white. The temperature IS the brand voice.
- Deep coffee ink `{colors.ink}` (`#201515`) — not pure black. Warmth carries through to text.
- Proprietary Degular Display for hero-scale, Inter for everything else. Two-face system.
- `{rounded.md}` 12 px for buttons and cards — the brand's middle-radius signature.
- A muted cream / coffee neutral ladder — `{colors.canvas-soft}` (`#f8f4f0`), `{colors.mute}` (`#c5c0b1`), `{colors.body-mid}` (`#939084`), `{colors.body}` (`#605d52`) — every neutral carries warmth, none are cool grey.

## Colors

### Brand & Accent
- **Zapier Orange** (`{colors.primary}` — `#ff4f00`): The single brand accent. Every primary CTA pill, every conversion target. The saturated orange IS the brand.

### Surface
- **Canvas** (`{colors.canvas}` — `#fffefb`): Warm off-white page background.
- **Canvas Soft** (`{colors.canvas-soft}` — `#f8f4f0`): Cream-tinted soft surface for cards / inset regions.

### Text
- **Ink** (`{colors.ink}` — `#201515`): Deep coffee — every heading and primary text.
- **Ink Soft** (`{colors.ink-soft}` — `#2f2a26`): Near-black with brown warmth.
- **Ink Mid** (`{colors.ink-mid}` — `#36342e`): Mid-emphasis text.
- **Body** (`{colors.body}` — `#605d52`): Default body text color.
- **Body Mid** (`{colors.body-mid}` — `#939084`): Secondary body / metadata.
- **Mute** (`{colors.mute}` — `#c5c0b1`): Lowest-priority text — fine print, low-emphasis captions.

### Semantic
The brand doesn't surface a separate semantic palette on its marketing pages. Status / validation cues borrow from the ink + orange hierarchy.

## Typography

### Font Family
Two faces ladder the system:
1. **Degular Display** — proprietary geometric display sans used for hero headlines at weight 500. The brand's typographic signature.
2. **Inter** — used for sub-displays, body, links, buttons, and eyebrows. Weights 400 / 500 / 600 / 700 are present.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 56px | 500 | 56px | 0 | Hero headline (Degular Display). |
| `{typography.display-lg}` | 48px | 500 | 48px | 0 | Sub-hero displays (Degular Display). |
| `{typography.display-md}` | 32px | 500 | 36px | 1px | Section displays (Degular Display, positive tracking). |
| `{typography.display-sub-lg}` | 48px | 500 | 49.92px | 0 | Inter-rendered sub-display. |
| `{typography.display-sub-md}` | 32px | 400 | 40px | 0 | Inter sub-display. |
| `{typography.display-sub-sm}` | 24px | 600 | 30px | -0.6px | Card titles (Inter, semibold). |
| `{typography.display-xs}` | 20px | 700 | 25px | -0.5px | Inline display micro-headings. |
| `{typography.body-lg}` | 20px | 400 | 30px | -0.2px | Lead paragraphs. |
| `{typography.body-md}` | 18px | 400 | 27px | 0 | Default body. |
| `{typography.body-md-strong}` | 18px | 600 | 27px | 0 | Bolded inline body. |
| `{typography.body-sm}` | 16px | 400 | 24px | 0 | Secondary body. |
| `{typography.body-sm-strong}` | 16px | 600 | 24px | 0 | Bold caption. |
| `{typography.caption}` | 14px | 400 | 21px | 0 | Fine print. |
| `{typography.eyebrow-uppercase}` | 14px | 500 | 14px | 1px | UPPERCASE eyebrow (Degular Display, positive tracking). |
| `{typography.button-md}` | 18px | 600 | 27px | 0 | Primary button label. |
| `{typography.button-sm}` | 14.4px | 700 | 14.4px | 0.144px | Small button label. |

### Principles
- **Degular Display 500 for hero, Inter for everything else.** Strict role separation.
- **Positive tracking on the Degular eyebrow** — `1 px` at 14 px is the brand's signature label style.
- **Sentence-case headlines.** The brand never uppercases display sizes.

### Note on Font Substitutes
Degular Display is proprietary. Open-source substitutes:
- **Display** — *Inter* weight 500 at hero scale comes closest. *Mona Sans* weight 500 is a softer alternative.
- **Sub-display + body** — *Inter* is the brand's actual second face.

## Layout

### Spacing System
- **Base unit**: 4 px.
- **Tokens**: `{spacing.xxs}` 2 px · `{spacing.xs}` 4 px · `{spacing.sm}` 8 px · `{spacing.md}` 12 px · `{spacing.lg}` 16 px · `{spacing.xl}` 24 px · `{spacing.2xl}` 32 px · `{spacing.3xl}` 48 px · `{spacing.4xl}` 64 px.
- **Section padding**: bands use `{spacing.4xl}` 64 px top/bottom.
- **Card interior**: cards at `{spacing.xl}` 24 px.

### Grid & Container
- Marketing container ~1280 px wide; centred with gutters.
- Hero: split at desktop (headline left, illustration right); stacked at mobile.
- Pricing tier grid: 3 / 4-up at desktop.

### Responsive Strategy

#### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | Hero stacks; grids 1-up; hamburger nav. |
| Tablet | 768–1023px | 2-up grids. |
| Desktop | ≥ 1024px | Full grids; hero split. |

#### Touch Targets
Buttons render ~48 px tall (12 vertical padding + 27 line). WCAG AAA met.

#### Image Behavior
The brand uses illustrative SVGs of zaps / workflows + product screenshots inside `{rounded.md}` framed cards. Photography is rare.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Level 0 — Flat | No shadow, no border. | Default for hero. |
| Level 1 — Hairline | 1 px solid `{colors.ink}` border. | Pricing-tier card chrome, outline buttons. |
| Level 2 — Soft Card | `{colors.canvas-soft}` cream fill against `{colors.canvas}` page. | Default content cards — surface contrast carries elevation. |

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Full-bleed bands. |
| `{rounded.sm}` | 6px | Inline pills, form inputs. |
| `{rounded.md}` | 12px | The brand's canonical button + card radius. |
| `{rounded.pill}` | 9999px | Status pills, badges. |
| `{rounded.full}` | 9999px | Circular icon containers. |

## Components

### Buttons

**`button-primary`** — the orange CTA.
- Background `{colors.primary}`, text `{colors.on-primary}` (warm white), label `{typography.button-md}`, padding `{spacing.md} {spacing.xl}`, shape `{rounded.md}` 12 px.

**`button-secondary`** — the dark coffee-ink CTA.
- Background `{colors.ink}`, text `{colors.on-primary}`, same typography / padding / shape.

**`button-tertiary`** — the outline CTA.
- Background `{colors.canvas}`, text `{colors.ink}`, 1 px solid `{colors.ink}` border, same typography / padding / shape.

**`button-text`** — text-only CTA used inside cards / nav.
- Background `{colors.canvas}`, text `{colors.ink}`, body in `{typography.button-sm}`, padding `{spacing.sm} {spacing.lg}`, shape `{rounded.md}`.

### Cards & Containers

**`card-content`** — the default cream content card.
- Background `{colors.canvas-soft}`, text `{colors.ink}`, padding `{spacing.xl}`, shape `{rounded.md}`.

**`card-feature-cream`** — the cream feature card.
- Same chrome as `card-content`. Hosts headline + body + illustration.

**`card-feature-dark`** — the polarity-flipped dark coffee card.
- Background `{colors.ink}`, text `{colors.on-primary}`, padding `{spacing.xl}`, shape `{rounded.md}`.

**`pricing-card`** — the default pricing tier card.
- Background `{colors.canvas}`, text `{colors.ink}`, 1 px solid `{colors.ink}` border, padding `{spacing.xl}`, shape `{rounded.md}`.

**`pricing-card-featured`** — the polarity-flipped featured pricing tier.
- Background `{colors.ink}`, text `{colors.on-primary}`, same shape / padding.

### Inputs & Forms

**`text-input`** — the canonical text input.
- Background `{colors.canvas}`, text `{colors.ink}`, 1 px solid `{colors.ink}` border, body in `{typography.body-md}`, padding `{spacing.md} {spacing.lg}`, shape `{rounded.sm}` 6 px.

### Navigation

**`nav-bar`** — the sticky top nav.
- Background `{colors.canvas}`, text `{colors.ink}`, padding `{spacing.md} {spacing.xl}`.

**`nav-link`** — link items inside nav.
- Text `{colors.ink}`, set in `{typography.body-sm}`.

**`footer`** — the dark coffee footer.
- Background `{colors.ink}`, text `{colors.canvas-soft}`, padding `{spacing.3xl} {spacing.xl}`. Body in `{typography.body-sm}`.

### Signature Components

**`hero-band`** — the cream hero band.
- Background `{colors.canvas}`, text `{colors.ink}`, padding `{spacing.4xl} {spacing.xl}`. Headline in `{typography.display-xl}` (Degular Display 56 px / 500).

**`hero-band-dark`** — the polarity-flipped dark coffee hero.
- Background `{colors.ink}`, text `{colors.on-primary}`, same scale.

**`content-band-cream`** — the cream content band that follows hero.
- Background `{colors.canvas-soft}`, text `{colors.ink}`, padding `{spacing.4xl} {spacing.xl}`. Section headline in `{typography.display-lg}`.

**`content-band-light`** — the white content band.
- Background `{colors.canvas}`, text `{colors.ink}`, same padding / scale.

**`eyebrow-uppercase`** — the small UPPERCASE Degular eyebrow above section headlines.
- Text `{colors.ink}`, set in `{typography.eyebrow-uppercase}` (14 px / 500 / `1 px` tracking).

**`badge-pill`** — the inline pill for metadata / tag.
- Background `{colors.canvas-soft}`, text `{colors.ink}`, body in `{typography.body-sm}`, padding `{spacing.xs} {spacing.md}`, shape `{rounded.pill}`.

### Examples (illustrative)

> Auto-derived kit-mirror demonstration surfaces (`scripts/derive-examples-block.mjs`). Each `ex-*` entry references brand-native primitives so downstream consumers (`/preview-design`, `/generate-kit`) re-skin the same 10 surfaces consistently. `TO_FILL` markers indicate missing primitives — resolve in the LLM judgment pass.

**`ex-pricing-tier`** — Default Pricing tier card. Re-uses feature-card chrome with brand canvas-soft surface.
- Properties: `backgroundColor`, `textColor`, `borderColor`, `rounded`, `padding`

**`ex-pricing-tier-featured`** — Featured/highlighted tier — polarity-flipped surface (dark fill + light text in light mode, light fill + dark text in dark mode).
- Properties: `backgroundColor`, `textColor`, `rounded`, `padding`

**`ex-product-selector`** — What's Included summary card — re-purposed for SaaS / B2B verticals (NOT a literal product gallery).
- Properties: `backgroundColor`, `rounded`, `padding`

**`ex-cart-drawer`** — Subscription summary — re-purposed for SaaS / B2B (line items per add-on, not literal cart).
- Properties: `backgroundColor`, `rounded`, `padding`, `item-divider`

**`ex-app-shell-row`** — Sidebar nav row inside the App Shell example. Active state uses brand primary as the indicator.
- Properties: `backgroundColor`, `activeIndicator`, `rounded`, `padding`

**`ex-data-table-cell`** — Default data-table th + td chrome. Header uses mono-caps eyebrow typography; body uses body-sm.
- Properties: `headerBackground`, `headerTypography`, `bodyTypography`, `cellPadding`, `rowBorder`

**`ex-auth-form-card`** — Sign-in / sign-up card. Re-uses feature-card chrome with text-input primitives inside.
- Properties: `backgroundColor`, `rounded`, `padding`

**`ex-modal-card`** — Modal dialog surface — same chrome as feature-card with elevated shadow.
- Properties: `backgroundColor`, `rounded`, `padding`

**`ex-empty-state-card`** — Empty-state illustration frame.
- Properties: `backgroundColor`, `rounded`, `padding`, `captionTypography`

**`ex-toast`** — Toast notification surface — feature-card shape + medium shadow.
- Properties: `backgroundColor`, `rounded`, `padding`, `typography`


## Do's and Don'ts

### Do
- Reserve `{colors.primary}` Zapier orange for every primary CTA. The saturated orange IS the conversion signature.
- Keep canvas WARM — `{colors.canvas}` `#fffefb` cream, not pure white. The temperature is the brand voice.
- Set hero headlines in `{typography.display-xl}` Degular Display weight 500. Sentence-case, no uppercase.
- Pair Degular Display (hero, eyebrow) with Inter (everything else). Two faces, two roles.
- Use `{rounded.md}` 12 px for buttons + cards. The middle radius is the brand's signature.
- Pair orange CTA with ink-dark text on cream backgrounds — the three-token rhythm is the brand's whole conversion story.

### Don't
- Don't replace cream canvas with pure white. The warmth is the brand.
- Don't use pure black ink. The coffee-warmth in `#201515` carries through every text color.
- Don't render CTAs as pills. The brand's button is 12 px rounded rectangle.
- Don't introduce a second chromatic accent. Orange + cream + coffee is the entire palette.
- Don't substitute Degular Display with a cool geometric sans (e.g., generic Helvetica) — the brand's display face has warm proportions that the substitute doesn't capture.
