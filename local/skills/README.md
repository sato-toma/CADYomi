# AI Working Guide

This folder stores the working rules for AI assistants and contributors.

## Purpose

The project should remain understandable to multiple AI systems, not only to one chat session. This is why the documentation is intentionally short, explicit, and structured.

## Rules

### 1. Documentation language

All AI-facing documentation must be written in English.

This includes:

- design notes
- architecture notes
- implementation plans
- code comments
- commit messages

### 2. Scope discipline

Before adding a feature, check whether it belongs to the current milestone.

The first milestone is about:

- STEP import
- model structure
- entity tree
- property inspection
- plugin architecture

The first milestone is not about creating a full rendering system, editing workflow, or AI API as the default product.

### 3. Documentation before architecture changes

Before introducing a CAD kernel, renderer, file format, or API transport:

- Read the relevant ADR.
- Update or add an ADR when the decision is not already recorded.
- Update `local/DEVELOPMENT.md` when the implementation order changes.
- Keep API contracts under `docs/api/` and document schemas before implementation.

### 4. Plugin-first thinking

Any feature that is not a core dependency should be added as a plugin whenever practical.

Examples:

- bounding box analysis
- measurements
- highlight overlays
- selection helpers
- inspection panels
- additional render backends

### 5. Model-first workflow

Prefer one of these flows:

```text
STEP file -> model -> tree -> properties -> targeted visual plugin
```

Do not jump directly into heavy rendering before the structure is clear.

### 6. Keep the project readable

A new AI should be able to answer these questions quickly:

- What is the product goal?
- What is in scope?
- What is out of scope?
- How are plugins organized?
- What is the first milestone?
- Where are architecture decisions and API contracts documented?

---

## Files in this folder

- [ai-workflow.md](ai-workflow.md) — working workflow for implementation and validation
