# CADYomi API Contracts

This directory contains the machine-readable contracts and human-readable documentation for the local CADYomi agent API.

The API is a future integration boundary. The first implementation target is a small read-only capability and entity-inspection contract, not a complete CAD editing service.

## Contract policy

- Document an operation before implementing it.
- Use JSON Schema for reusable data structures and payload validation.
- Use OpenAPI 3.1 when the transport is HTTP.
- Evaluate Model Context Protocol (MCP) for AI-agent-native tools and resources.
- Use AsyncAPI only if the API grows an event or message-broker transport.
- Use TOML for human-edited configuration only, never as the API contract format.
- Version the API and record breaking changes in an ADR.
- Use stable model and entity identifiers, never renderer IDs or WebAssembly pointers.
- Document capabilities, side effects, geometry requirements, progress, cancellation, and errors for every operation.
- Keep the original source file immutable until an explicit export or replacement action is confirmed.

## Planned layout

```text
api/
  README.md
  schemas/
    common/
    inspection/
    changesets/
  openapi/
    local-agent.yaml
  mcp/
    local-agent.md
```

The directories are intentionally empty until the first API operation is implemented. Do not add a speculative schema that is not exercised by code or a proof-of-concept client. Avoid maintaining the same schema independently in multiple formats.

## Format selection

| Need | Preferred format | Role |
| --- | --- | --- |
| Shared request, response, model, or change-set data | JSON Schema | Machine-readable data contract |
| Local HTTP API | OpenAPI 3.1 | Endpoints, transport, security, and references to schemas |
| AI agent tools and resources | MCP | Agent-facing protocol; tool schemas use JSON Schema-compatible definitions |
| Event or message-broker API | AsyncAPI | Messages, channels, and event transport |
| Application or user configuration | TOML or JSON | Configuration only, not an API contract |

## Initial contract order

1. Capability discovery
2. Entity tree and pagination
3. Entity properties
4. Selected-subtree analysis
5. Progress and cancellation
6. Change-set creation and validation
7. Export to a new file

See [ADR 0002](../adr/0002-format-adapters-and-local-agent-api.md) for the architectural decision and proof-of-concept requirements.
