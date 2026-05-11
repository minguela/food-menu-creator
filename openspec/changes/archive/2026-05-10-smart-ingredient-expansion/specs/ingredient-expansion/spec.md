## ADDED Requirements

### Requirement: System can expand dish names to ingredients
The system SHALL provide a mapping system that expands dish names to their base ingredients based on configurable rules.

#### Scenario: Expansion rule exists
- **WHEN** a dish named "ensalada" is processed
- **THEN** system expands it to "canónigos", "tomate", "aceite de oliva"

#### Scenario: Multiple aliases for same dish
- **WHEN** a dish named "tortilla española" is processed
- **THEN** system matches it to the same rule as "tortilla" and expands to "huevos", "patatas", "aceite"

#### Scenario: No expansion rule exists
- **WHEN** a dish with no matching rule is processed
- **THEN** system keeps original dish name and marks it as unexpanded

#### Scenario: Admin creates new expansion rule
- **WHEN** admin adds a new rule mapping "paella" to ["arroz", "pollo", "mariscos", "pimiento"]
- **THEN** system stores rule in database and applies to future dishes

#### Scenario: Admin updates existing rule
- **WHEN** admin modifies the ingredients for "tortilla" rule
- **THEN** system updates rule and new expansions use updated ingredients

#### Scenario: Admin deletes expansion rule
- **WHEN** admin deletes rule for "ensalada"
- **THEN** system removes rule and future "ensalada" dishes are marked as unexpanded