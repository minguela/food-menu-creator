## Design Overview

The restyle applies the new design specification as a global baseline instead of one-off page overrides.

### Token strategy

- Keep `theme.css` as the Tailwind `@theme` token source.
- Import `theme.css` from `main.css` so app-level CSS and Tailwind utilities share the same vocabulary.
- Remap existing `ui-*` utility variables in `main.css` to the new dark palette and accent glow.

### Typography

- Use `Inter` for body copy.
- Use `Montserrat` as display fallback for the intended aeonik-like headline role.
- Keep a monospace face available for technical inline content and JSON fields.

### Surface and navigation treatment

- Update shell gradients and cards to black/near-black layers with subtle contrast.
- Keep white text and subdued gray secondary text.
- Neutralize previous blue-heavy navigation hover/active states.

### Non-goals

- No layout/IA rewrite.
- No feature behavior changes.
