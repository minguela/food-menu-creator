## Why

The web UI has accumulated mixed visual patterns (blue accents, older font stack, and inconsistent shell surfaces) that no longer match the new design direction documented in `menu-web/DESIGN.md` and the provided `menu-web/assets/css/theme.css` tokens.

## What Changes

- Adopt the new midnight command-center visual language in global theme primitives.
- Wire `theme.css` tokens into the runtime styles and align typography with the design guide.
- Refresh shell navigation and common component surfaces to keep a cohesive dark high-contrast appearance.

## Capabilities

### New Capabilities
- `midnight-command-center-theme`: unified visual system based on design tokens.

## Impact

- Affected UI files:
  - `menu-web/assets/css/main.css`
  - `menu-web/assets/css/theme.css`
  - `menu-web/nuxt.config.ts`
  - `menu-web/app.vue`
- No API or database changes.
