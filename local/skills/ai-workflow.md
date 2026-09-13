# AI Workflow

## Start with the product boundary

Before implementing code, confirm the current milestone boundary.

The current goal is not "complete CAD rendering". The current goal is a structured inspection workflow.

## Preferred order

1. Understand the STEP model structure
2. Build the minimal internal representation
3. Show the tree of entities
4. Show the selected entity properties
5. Add a simple plugin to validate the extension model
6. Add optional visual overlays only when useful

## Rules for feature work

- Keep feature scope small.
- Prefer plugin boundaries over monolithic logic.
- Add visual features only after the underlying model is understandable.
- Use English in all docs and code comments.
- Prefer simple, explicit code over abstract design theater.

## Example plugin set

- EntityTreePlugin
- PropertyInspectorPlugin
- BoundingBoxPlugin
- MeasurementPlugin
- SelectionHighlightPlugin

## Commit message rule

Commit messages must be written in English and should be understandable to a high-school-level developer.

Example:

- Add initial STEP model structure and plugin shell
- Add entity tree and property inspection prototype
- Add bounding box plugin example

## Documentation standard

When adding documentation, prefer:

- direct product goals
- short examples
- clear delimiter between MVP and future work
- clear statements of what is excluded from the first phase
