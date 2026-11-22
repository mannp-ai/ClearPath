---
name: ClearPath Financial System
colors:
  surface: '#f9f9ff'
  surface-dim: '#d1daf4'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8ff'
  surface-container-highest: '#d9e2fc'
  on-surface: '#121b2e'
  on-surface-variant: '#434654'
  inverse-surface: '#273044'
  inverse-on-surface: '#edf0ff'
  outline: '#747685'
  outline-variant: '#c4c5d6'
  surface-tint: '#2854cc'
  primary: '#214fc7'
  on-primary: '#ffffff'
  primary-container: '#4169e1'
  on-primary-container: '#f8f7ff'
  inverse-primary: '#b6c4ff'
  secondary: '#006c53'
  on-secondary: '#ffffff'
  secondary-container: '#91f2cf'
  on-secondary-container: '#007056'
  tertiary: '#7b5000'
  on-tertiary: '#ffffff'
  tertiary-container: '#9b6700'
  on-tertiary-container: '#fff6ef'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#003baf'
  secondary-fixed: '#94f5d2'
  secondary-fixed-dim: '#78d8b7'
  on-secondary-fixed: '#002117'
  on-secondary-fixed-variant: '#00513e'
  tertiary-fixed: '#ffddb3'
  tertiary-fixed-dim: '#feba53'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#624000'
  background: '#f9f9ff'
  on-background: '#121b2e'
  surface-variant: '#d9e2fc'
typography:
  display-kpi:
    fontFamily: Geist
    fontSize: 3rem
    fontWeight: '600'
    lineHeight: 3.5rem
    letterSpacing: -0.03em
  display-kpi-mobile:
    fontFamily: Geist
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: 2.75rem
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Geist
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Geist
    fontSize: 1.375rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.25rem
  metric-table:
    fontFamily: Geist
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
  label-caps:
    fontFamily: Geist
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.05em
  label-md:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1.125rem
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  gutter-lg: 2rem
  margin: 2rem
  margin-sm: 1rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

The design system projects mathematical rigor, quiet confidence, and institutional trust for high-debt borrowers seeking optimization and debt relief. Rooted in high-performance fintech aesthetics—balancing the operational sharpness of Linear with the refined spatial composure of Mercury and Stripe—the experience prioritizes legibility, financial reassurance, and rapid decision modeling over ornamental distraction.

### Visual Style
- **Minimal Precision & Tonal Structure:** Structural boundaries rely on delicate 1px neutral borders and micro-tinted surface tiers rather than heavy shadows.
- **Instrument-Grade UI:** High-density data layouts, structured financial comparisons, tabular numerical alignment, and restrained interaction feedback communicate computational accuracy.
- **Calm Velocity:** Interactions feel instantaneous and grounded. Transitions employ tight ease-out curves (150ms–200ms) with zero theatrical bounce.

## Colors

The palette establishes an authoritative, high-clarity environment engineered for complex debt amortizations and scenario comparisons.

- **Primary Canvas & Surfaces:** Background canvases use `#F8FAFC`, stepping into pure `#FFFFFF` for interactive cards, data tables, and input groups. Secondary panels and table headers sit on `#F1F5F9`.
- **Text & Hierarchy:** Text relies on high-contrast `#172033` for primary metrics, headers, and values, balanced by `#667085` for meta-labels, sub-metrics, and structural guides.
- **Functional Accents:**
  - **Royal Blue (`#4169E1`):** Applied strictly to primary actions, interactive focus rings, active simulation paths, and primary debt scenarios.
  - **Payoff Emerald (`#168568`):** Reserved exclusively for positive delta indicators, cumulative interest saved, balance drops, and accelerated debt-free milestones.
  - **Warning Amber (`#D99A36`):** Identifies variable-rate risk, capitalization events, and penalty thresholds.
  - **Error Crimson (`#DC5252`):** Highlights payment shortfalls, unlinked servicers, and amortization calculation errors.
- **Dividers & Structural Borders:** Universal border delimiter is `#E6EAF0`, providing crisp, hair-thin isolation across light backgrounds without visual clutter.

## Typography

Typographic scale prioritizes scannability and structural alignment.

- **Typeface Roles:**
  - **Geist:** Selected for all headlines, numeric displays, telemetry cards, and data metrics. Enables crisp, technical geometric forms.
  - **Inter:** Selected for narrative explanations, body copy, form labels, and instructional disclaimers. Delivers high legibility at dense standard sizes.
- **Tabular Numerals (`tnum`):** All financial metrics, rate values, payoff months, and amortization figures must enforce OpenType `font-variant-numeric: tabular-nums; lining-nums;` to prevent layout shift during slider manipulations and real-time modeling.
- **Uppercase Labels:** System metrics and column categories utilize `label-caps` styled with standard uppercase transform and wide tracking to act as clear categorical delimiters.

## Layout & Spacing

A strict 8px structural rhythm governs all structural shells, card gaps, and metric cells.

### Layout Philosophy
- **Standard Layout:** 12-column responsive fluid grid pinned to a maximum content container width of 1440px with dynamic side margins.
- **Sidebar & Shell:** Fixed left navigation (240px wide on desktop), with fluid right application workspace.
- **Breakpoints:**
  - **Desktop (≥ 1280px):** 12 columns, 32px (`space-xl`) canvas margins, 24px (`space-lg`) gutters. Metrics stack up to 4 across.
  - **Tablet (768px – 1279px):** 8 columns, 24px canvas margins, 16px gutters. Comparison cards stack 2 across; secondary panels collapse into drawer overlays.
  - **Mobile (< 768px):** 4 columns, 16px canvas margins, 16px gutters. Dashboard metrics and loan split rows stack into vertical full-width cards. Fixed bottom bar for quick payoff scenario triggers.

## Elevation & Depth

Depth is established primarily through hairline borders, contrasting surface fills, and micro-diffused ambient shadows.

- **Base Layering (Flat Plane System):**
  - **Level 0 (Canvas):** `#F8FAFC` — Base viewport background.
  - **Level 1 (Sub-Panel / Header):** `#F1F5F9` — Inactive table bands, segmented toggle wells, card header blocks.
  - **Level 2 (Active Cards / Data Surfaces):** `#FFFFFF` bordered by 1px solid `#E6EAF0`.
- **Shadow Tokens:**
  - **Surface Elevation (Cards, Metrics):** `0 1px 2px 0 rgba(23, 32, 51, 0.04)`.
  - **Interactive Hover:** `0 4px 12px -2px rgba(23, 32, 51, 0.06), 0 2px 4px -1px rgba(23, 32, 51, 0.03)`.
  - **Floating Overlays (Modals, Popovers, Filter Menus):** `0 12px 32px -4px rgba(23, 32, 51, 0.10), 0 4px 8px -2px rgba(23, 32, 51, 0.04)`.
- **Focus States:** High-contrast focus state utilizes a double-layer ring: `0 0 0 2px #FFFFFF, 0 0 0 4px #4169E1`.

## Shapes

The design uses a refined, architectural curvature with a base roundedness index of 2.

- **Base Radius (0.5rem / 8px):** Applied to form fields, buttons, interactive table tags, dropdown menus, and slider thumbs.
- **Large Radius (1rem / 16px):** Applied to top-level KPI metric containers, payoff comparison modules, and amortization card panels.
- **Extra Large Radius (1.5rem / 24px):** Reserved for modal overlays, complex slide-out panels, and onboarding dialogs.
- **Full Pill (`9999px`):** Used strictly for numerical status badges, active filter tokens, and comparison tags to contrast against sharp linear data grids.

## Components

### Buttons
- **Primary:** Solid `#4169E1` fill, `#FFFFFF` text, 0.5rem radius, 10px vertical and 16px horizontal padding. Hover: `#3557C7`. Active: `#2B47A8`.
- **Secondary / Outlined:** `#FFFFFF` background, 1px `#E6EAF0` border, `#172033` text. Hover: `#F8FAFC` background with `#D0D7E2` border.
- **Destructive:** `#FFFFFF` background, 1px `#DC5252` border, `#DC5252` text. Hover: `#FEF2F2` background.
- **Compact Table Actions:** 28px height, 0.375rem radius, text size `0.8125rem`, subtle background transition on hover.

### Inputs & Sliders (Simulation Controls)
- **Currency Inputs:** `#FFFFFF` background, 1px `#E6EAF0` border, 8px radius. Pre-appended fixed currency symbol in `#667085`. On focus: 1px `#4169E1` border with a 2px royal blue outer ring.
- **Interactive Financial Sliders:** 
  - Track: 6px height, rounded pill, filled with `#4169E1` up to the current thumb position, remaining track colored in `#E6EAF0`.
  - Thumb: 20px circle, `#FFFFFF` fill, 2px solid `#4169E1`, drop shadow `0 2px 4px rgba(23, 32, 51, 0.15)`. Active manipulation displays a floating tooltip with tabular figures.

### Cards & KPI Modules
- **Metric Cards:** `#FFFFFF` background, 1px `#E6EAF0` border, 16px radius, 24px internal padding. Category label in `label-caps` muted color, primary number in `display-kpi` Geist bold, bottom sub-row with payoff delta badge (`#168568` background at 10% opacity, `#168568` text).
- **Comparison Engine Modules:** Side-by-side cards comparing "Current Trajectory" versus "Optimized ClearPath Strategy". The optimized card receives a subtle 1px border colored with `#168568` (20% opacity) and an emerald highlight pill tag.

### Data Tables & Amortization Schedules
- **Header:** `#F8FAFC` background, 1px border bottom `#E6EAF0`, uppercase 11px Geist typography, sortable indicators aligned right for numerical values.
- **Rows:** Alternating hover highlight using `#F8FAFC`. Base row height 44px for high density. Column metrics right-aligned with monospace/tabular-num glyphs.
- **Inline Badges:** Pill-shaped status indicators (e.g., "Refinanced", "Direct Debit Applied", "Grace Period") with subtle pastel fills and dark contextual text.

### Segmented Controls & Toggles
- Recessed container using `#F1F5F9` background, 6px internal padding, 8px radius. Active segment lifts using pure `#FFFFFF` background, 1px `#E6EAF0` border, and light shadow `0 1px 2px rgba(0,0,0,0.05)`.