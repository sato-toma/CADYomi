# AI Workflow

## Start with the product boundary

Before implementing code, confirm the current milestone boundary.

The current goal is not "complete CAD rendering". The current goal is a structured inspection workflow that works on desktop and mobile browsers.

Before changing an architecture boundary, read:

1. The relevant ADR in `docs/adr/`
2. The execution order in `local/DEVELOPMENT.md`
3. The API contract rules in `docs/api/` when an agent operation is involved

## Preferred order

1. Understand the STEP model structure
2. Build the minimal internal representation
3. Show the tree of entities
4. Show the selected entity properties
5. Tessellate and display only the selected entity or subtree
6. Add a simple plugin to validate the extension model
7. Add optional visual overlays only when useful

## Rules for feature work

- Keep feature scope small.
- Prefer plugin boundaries over monolithic logic.
- Add visual features only after the underlying model is understandable.
- Do not make full-model rendering a prerequisite for metadata or tree inspection.
- Keep the original CAD source immutable during an inspection session.
- Represent future edits as validated change sets and export new files.
- Keep file-format details behind importer adapters.
- Keep local agent operations behind documented, versioned contracts.
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

## Architecture decision workflow

When a task changes an importer, renderer, file format, processing location, API transport, or editing model:

1. State the problem and constraints.
2. Check whether an existing ADR covers the decision.
3. Record the decision, alternatives, risks, and verification steps.
4. Update the development plan only for the resulting implementation order.
5. Implement the smallest proof of concept.
6. Update the ADR status when evidence is available.

For API work, document the operation and machine-readable schema before implementing it. Use JSON Schema for shared payloads, OpenAPI for HTTP, and evaluate MCP for agent-native tools. TOML is for configuration, not API contracts.
