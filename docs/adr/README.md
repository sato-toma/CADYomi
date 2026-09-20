# Architecture Decision Records

This directory records decisions that affect CADYomi architecture, dependencies, or long-term maintenance.

## Format

Each ADR should include:

- Title and decision number
- Status: Proposed, Accepted, Superseded, or Rejected
- Date
- Context and constraints
- Decision drivers
- Decision
- Consequences
- Alternatives considered
- Follow-up and review triggers
- Verification or follow-up work
- References to primary documentation

An ADR records the decision at the time it was made. New evidence should result in a new ADR or an explicit update to the status and consequences of the existing one.

## Template

```markdown
# ADR NNNN: Title

- Status: Proposed
- Date: YYYY-MM-DD
- Deciders: CADYomi maintainers

## Context

What problem or change requires a decision? Include constraints and relevant facts.

## Decision Drivers

- Driver one
- Driver two

## Decision

State the decision and its scope in direct language.

## Consequences

### Positive

### Negative and risks

## Alternatives Considered

### Alternative

Why it was not selected, or when it should be reconsidered.

## Follow-up

Verification steps, owners, review triggers, and conditions for changing the decision.

## References

- Primary documentation or experiments
```

Use `Proposed` when implementation evidence is still missing. Change the status to `Accepted` only after the stated verification is complete.

## Decisions

- [ADR 0001: STEP Import and Rendering Boundaries](0001-step-import-and-renderer-boundaries.md)
- [ADR 0002: Format Adapters and Local Agent API](0002-format-adapters-and-local-agent-api.md)
