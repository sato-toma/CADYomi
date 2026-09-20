# ADR 0002: Format Adapters and Local Agent API

- Status: Proposed
- Date: 2026-09-20
- Deciders: CADYomi maintainers

## Context

- STEP is the first supported format.
- Future candidates include IGES, STL, OBJ, FBX, JT, and glTF/GLB.
- Formats differ in topology, assemblies, metadata, editing, and export support.
- CAD analysis and editing should be available to a local AI agent.
- CAD files may contain confidential information.
- The API must not depend on React, OCCT, Redux, or a renderer.

## Decision Drivers

- Keep STEP first without blocking future formats.
- Give agents a stable model-level boundary.
- Use common open-source API standards.
- Keep data local by default.
- Separate read-only analysis from editing.
- Document contracts before implementation.

## Decision

- Add future formats through independent importer adapters.
- Adapters produce the common CADYomi inspection model.
- Adapters report unsupported features and capabilities.
- Keep format support separate from rendering.
- Provide a versioned local agent API over the common model.
- Use stable model and entity IDs.
- Never expose WebAssembly pointers or renderer IDs as durable IDs.
- Keep the original source file immutable.
- Represent editing as a validated change set.
- Export a new file after explicit user approval.
- Default the API to loopback or equivalent local transport.
- Require explicit opt-in before network exposure.

## Contract Format

- JSON Schema:
  - Shared request and response data
  - Entity references
  - Change sets
- OpenAPI 3.1:
  - HTTP endpoints
  - Security and transport
- MCP:
  - Agent-native tools and resources
  - Evaluate with a real client before selection
- AsyncAPI:
  - Use only for event or message-broker transport
- TOML:
  - Configuration only
  - Not an API contract
- Keep one canonical schema and reference it from transport documents.

## Initial API Scope

Start with read-only operations:

- Capability discovery
- Root entity and paginated subtree queries
- Entity properties
- Selected-subtree analysis
- Selected-subtree tessellation metadata
- Progress and cancellation

Add editing later:

- Create a change set
- Validate a change set
- Apply it to an in-memory model
- Export a new file

## Consequences

### Positive

- New formats do not require UI or agent protocol changes.
- Agents can analyze CAD data without controlling the renderer.
- Desktop and mobile can share the same contracts.
- Side effects and unsupported features are explicit.
- Local-first processing protects CAD data.

### Negative and Risks

- A common model needs capability reporting and extension points.
- Versioning and schema review add work.
- A local API is still a security boundary.
- Long operations need progress, cancellation, and limits.
- Editing or export may lose unsupported data.

## Alternatives Considered

- One API per file format:
  - Rejected because clients would need format-specific knowledge.
- UI automation for agents:
  - Rejected because it is fragile and cannot express CAD revisions.
- Hosted CAD agent API:
  - Deferred because it conflicts with local-first privacy and adds backend scope.

## Follow-up

- Test capability and entity queries with a real local agent client.
- Compare MCP and local HTTP/OpenAPI with the same workflow.
- Add the first machine-readable schema under `docs/api/`.
- Document errors, revisions, permissions, and cancellation.
- Review this ADR when editing or a second transport is implemented.

## References

- [ADR 0001: STEP Import and Rendering Boundaries](0001-step-import-and-renderer-boundaries.md)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [JSON Schema](https://json-schema.org/specification)
- [Model Context Protocol](https://modelcontextprotocol.io/specification/latest)
- [AsyncAPI Specification](https://www.asyncapi.com/docs/reference/specification/latest)
