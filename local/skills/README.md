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

The first milestone is not about creating a full rendering system as the default product.

### 3. Plugin-first thinking

Any feature that is not a core dependency should be added as a plugin whenever practical.

Examples:

- bounding box analysis
- measurements
- highlight overlays
- selection helpers
- inspection panels
- additional render backends

### 4. Model-first workflow

Prefer one of these flows:

```text
STEP file -> model -> tree -> properties -> targeted visual plugin
```

Do not jump directly into heavy rendering before the structure is clear.

### 5. Keep the project readable

A new AI should be able to answer these questions quickly:

- What is the product goal?
- What is in scope?
- What is out of scope?
- How are plugins organized?
- What is the first milestone?

---

## Files in this folder

- [ai-workflow.md](ai-workflow.md) — working workflow for implementation and validation
