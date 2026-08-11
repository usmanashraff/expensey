---
name: Ethos Professional
colors:
  surface: '#f6fafe'
  surface-dim: '#d6dade'
  surface-bright: '#f6fafe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f4f8'
  surface-container: '#eaeef2'
  surface-container-high: '#e5e9ed'
  surface-container-highest: '#dfe3e7'
  on-surface: '#171c1f'
  on-surface-variant: '#444749'
  inverse-surface: '#2c3134'
  inverse-on-surface: '#edf1f5'
  outline: '#747879'
  outline-variant: '#c4c7c8'
  surface-tint: '#5c5f60'
  primary: '#5c5f60'
  on-primary: '#ffffff'
  primary-container: '#f8f9fa'
  on-primary-container: '#707273'
  inverse-primary: '#c5c7c8'
  secondary: '#5b5f63'
  on-secondary: '#ffffff'
  secondary-container: '#dde0e5'
  on-secondary-container: '#5f6368'
  tertiary: '#496177'
  on-tertiary: '#ffffff'
  tertiary-container: '#f6f9ff'
  on-tertiary-container: '#5d758b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e3e4'
  primary-fixed-dim: '#c5c7c8'
  on-primary-fixed: '#191c1d'
  on-primary-fixed-variant: '#454748'
  secondary-fixed: '#e0e3e8'
  secondary-fixed-dim: '#c3c7cc'
  on-secondary-fixed: '#181c20'
  on-secondary-fixed-variant: '#43474c'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#b0c9e3'
  on-tertiary-fixed: '#011d31'
  on-tertiary-fixed-variant: '#31495e'
  background: '#f6fafe'
  on-background: '#171c1f'
  surface-variant: '#dfe3e7'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
The design system transitions from a lifestyle aesthetic to a disciplined, high-fidelity financial environment. The personality is authoritative, precise, and intellectually rigorous. It leverages a **Minimalist** approach with a focus on editorial-grade typography and structured white space to evoke a sense of heritage and modern reliability.

The UI should feel like a premium digital ledger—stable, translucent, and highly organized. It targets a sophisticated audience that values clarity over decoration, utilizing generous margins and a restricted palette to focus attention on critical data and narratives.

## Colors
The palette is rooted in a professional, cool-toned spectrum. The primary surface is an **Off-White (#F8F9FA)**, providing a crisp, gallery-like foundation that avoids the warmth of traditional cream. 

- **Primary:** Off-White (#F8F9FA) for main backgrounds and large surfaces.
- **Secondary:** Soft Charcoal (#212529) for primary text, deep borders, and high-emphasis interaction states.
- **Tertiary:** Slate Blue (#4A6278) used sparingly for data visualization, links, and subtle status indicators.
- **Neutral:** Cool Grey (#DEE2E6) for secondary borders, disabled states, and structural dividers.

## Typography
The system employs a high-contrast typographic pairing to signal both tradition and efficiency. **Playfair Display** is reserved for headlines and display elements, bringing an editorial, "Black-Letter" authority to the interface. 

**Inter** serves as the functional workhorse for all body copy, data, and UI labels. It provides the necessary legibility for complex financial information. Use wide letter-spacing for `label-sm` to maintain a professional, architecturally clean appearance in navigation and metadata.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for desktop to maintain the "editorial" feel of a structured document, while transitioning to a fluid model for mobile devices. 

- **Desktop:** 12-column grid with a 1280px max-width, centered.
- **Rhythm:** Use an 8px base unit. Component internal padding should favor "airy" vertical spacing (e.g., 16px top/bottom) to prevent data density from feeling overwhelming.
- **Breakpoints:** Mobile (<768px), Tablet (768px - 1024px), Desktop (>1024px). On mobile, margins tighten to 16px, and multi-column card layouts stack vertically.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Low-Contrast Outlines** rather than aggressive shadows. 

- **Surfaces:** Use subtle shifts from the primary Off-White to a slightly darker grey for nested containers. 
- **Outlines:** Elements like cards and inputs use a 1px solid border in the Neutral shade (#DEE2E6). 
- **Shadows:** When necessary for temporary overlays (modals/dropdowns), use a "Paper" shadow: very large blur (32px), extremely low opacity (4%), and a slight blue-grey tint to match the tertiary palette.

## Shapes
In line with the "Round Four" requirement, this design system utilizes a **Pill-shaped** geometry. This softened edge contrasts against the sharp, serif typography to create a unique "Modern-Executive" look. 

- UI elements like buttons and chips utilize full pill-rounding.
- Primary cards and containers use `rounded-xl` (3rem) to create distinct visual silos.
- Selection indicators (like radio buttons or active states) should maintain this circular language.

## Components
- **Buttons:** Primary buttons use the Secondary Charcoal (#212529) with white Inter text. Secondary buttons use a Slate Blue outline with no fill. Always fully rounded.
- **Inputs:** Clean, 1px Neutral borders. On focus, the border transitions to Slate Blue with a subtle 2px glow.
- **Cards:** Use `rounded-xl` corner radii. No shadows by default; depth is created by a 1px Neutral border or a subtle tonal shift in background color.
- **Chips:** Small, pill-shaped tags used for categories or filters, utilizing a Slate Blue background at 10% opacity with Slate Blue text.
- **Data Tables:** Highly structured with minimal borders (horizontal only). Header text uses `label-sm` for a disciplined, professional appearance.
- **Interactive Lists:** Items should have generous vertical padding (16px+) to ensure the "premium" airy feel is maintained even in content-heavy views.