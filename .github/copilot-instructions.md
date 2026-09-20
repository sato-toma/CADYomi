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

## Restricted test data

The JAMA role-model STEP files are local-only test data.

- Store downloaded files only under the ignored `test-data/` directory.
- Never copy, move, rename, modify, publish, distribute, sell, or commit these files.
- Never include the files or derived copies in source code, screenshots, fixtures, archives, build output, or AI prompts.
- Do not upload the files to external services or send them to an AI service.
- Use the files only for local manual verification unless permission is confirmed separately.
- Do not download or relocate the files automatically; ask the user to place them locally when needed.

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
