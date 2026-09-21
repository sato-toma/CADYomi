# ADR 0003: STEP Tessellation Performance Defaults

- Status: Proposed
- Date: 2026-09-21
- Deciders: CADYomi maintainers

## Context

`occt-import-js.ReadStepFile()` imports the STEP document and tessellates geometry in one operation. The current browser proof of concept therefore cannot defer tessellation to a selected entity.

The UI now scans lightweight STEP records first so that a model index can appear before the OCCT worker completes. The OCCT worker still performs eager tessellation in the background.

A local assembly fixture of about 64 MB showed that the original tessellation setting could keep the worker busy for a long time and could end with an unhelpful worker-stopped error in the browser. This is an operational signal, not a benchmark or a production performance target.

## Decision

Use these temporary proof-of-concept defaults in the OCCT worker:

- `linearDeflectionType: "bounding_box_ratio"`
- `linearDeflection: 0.01`
- `angularDeflection: 0.5`
- Worker timeout: 120 seconds

The `0.01` value replaces `0.001` because the finer value increases triangle count, CPU time, and memory pressure during eager import. The coarser value is intended to make the current fallback more tolerant of large assemblies. It is not a measured quality optimum.

The 120-second timeout is a guard against an indefinitely pending worker. It is deliberately long enough for a large local STEP import while still producing a visible failure. It must not be treated as a substitute for cancellation or progressive processing.

The application must continue to show lightweight metadata before the eager import finishes. Worker failures must preserve that metadata view and expose the underlying error where available.

## Consequences

### Positive

- Large-file fallback imports use less aggressive tessellation.
- Users can see basic STEP records while the worker is busy.
- The reason for the current defaults is recorded and reversible.

### Negative and Risks

- Eager tessellation still consumes CPU and memory before a node is selected.
- A fixed timeout is device-dependent and may be too long or too short.
- Coarser tessellation can reduce visual quality.
- The lightweight STEP scanner is not a complete XDE assembly model.

## Replacement Plan

Replace these temporary defaults when an OCCT/XDE document-backed bridge is available:

```text
openStep(bytes)
  -> document handle + metadata/tree only
getEntityBounds(handle, entityId)
  -> bounds without tessellation
 tessellateEntity(handle, entityId, options)
  -> selected entity or subtree only
releaseDocument(handle)
```

The replacement must support cancellation, progress, stable entity IDs, explicit tessellation quality, and disposal of document and mesh resources.

## Follow-up

See [TODO: progressive tessellation](../TODO.md) for the implementation backlog.
