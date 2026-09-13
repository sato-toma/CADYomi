# Copilot Instructions

## Repository direction

The project is a CAD inspection tool, not a renderer-first application.

The first milestone is to understand the STEP structure, inspect entities, and provide a plugin-based extension model.

## Language policy

Use English for:

- documentation
- commit messages
- code comments
- design notes

## Scope policy

Keep work aligned with the current milestone.

Current milestone priorities:

1. STEP import and model parsing
2. entity tree display
3. property inspection
4. plugin architecture
5. targeted visual plugins

Do not expand the scope into a broad renderer or full CAD suite before the structure and inspection flow is working.

## Plugin-first rule

When adding functionality, prefer a plugin boundary rather than embedding logic deeply in the application core.

Examples:

- bounding box analysis
- measurement tools
- highlight overlays
- selection utilities
- render adapters

## Write clearly

Prefer short, readable explanations and simple English language.
