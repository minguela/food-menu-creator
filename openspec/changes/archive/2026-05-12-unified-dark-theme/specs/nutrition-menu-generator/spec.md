## MODIFIED Requirements

### Requirement: Generation UI MUST expose targets and deviations
The generation UI SHALL show the selected profile, daily targets, tolerance, generation action, generated days, meals, serving multipliers, target-vs-real macro totals, deviations, compliance status, score, and save action using the dark-only design system CSS variable tokens and `ui-*` utility classes defined in `main.css`.

#### Scenario: Generated result is inspectable
- **WHEN** generation completes
- **THEN** the UI SHALL display each generated day with kcal, protein, carbs, and fat target-vs-real values and deviations using `text-[var(--text-1)]`, `text-[var(--text-3)]`, `ui-surface` cards, and `ui-btn-primary`/`ui-btn-muted` buttons

#### Scenario: Save action is available
- **WHEN** a generated preview exists
- **THEN** the UI SHALL offer a save action using `ui-btn-primary` without requiring the user to regenerate the menu
