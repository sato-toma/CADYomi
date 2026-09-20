# ADR 0001: STEP Import and Rendering Boundaries

- Status: Proposed
- Date: 2026-09-20
- Deciders: CADYomi maintainers

## Context

- CADYomi is a browser-based STEP inspection tool.
- The first goal is model understanding, not full-model rendering.
- STEP data may include:
  - Assembly and entity hierarchy
  - Names and attributes
  - Colors and layers
  - Validation properties
- The application must work on desktop and mobile browsers.
- Candidate technologies:
  - OCCT/XDE
  - `opencascade.js`
  - `occt-import-js`
  - Three.js
  - Babylon.js

## Decision Drivers

- Preserve CAD structure and inspection metadata.
- Keep CAD files local by default.
- Support progressive loading on mobile.
- Keep importer and renderer implementations replaceable.
- Avoid selecting a library before a representative proof of concept.

## Decision

- Use the imported CAD document as the inspection model.
- Hide OCCT/XDE types behind an importer adapter.
- Keep React and renderer code independent of the CAD kernel.
- Treat tessellation as derived data.
- Preserve stable links from meshes to model entities and faces.
- Define a replaceable viewer interface.
- Support these progressive data modes:
  - Metadata only
  - Entity hierarchy and properties
  - Selected-entity or selected-subtree tessellation
  - Optional full-model tessellation
- Keep the original STEP file immutable during a session.
- Represent future edits as validated change sets.
- Export a new STEP file after review; do not silently overwrite the source.
- Do not add OCCT, importer, or renderer dependencies before the proof of concept.

## Progressive Inspection

- Show the entity tree or table before loading the full scene.
- Load geometry only for the selected entity or subtree.
- Support inspection without WebGL where possible.
- Release selected geometry when it is no longer needed.

## XDE Proof of Concept

Verify support for:

- Assembly and component relationships
- Product and instance names
- Shape and face colors
- Layer assignments
- Validation properties
- Entity-to-face or entity-to-mesh mapping

## Renderer Proof of Concept

Compare Three.js and Babylon.js using the same tessellation:

- Orbit, pan, zoom, and fit
- Picking and stable selection
- Visibility and color control
- Mobile memory and large-assembly performance
- WebGL fallback and optional WebGPU support
- React and Web Worker integration

## Consequences

### Positive

- Inspection data remains independent from display meshes.
- Mobile can use metadata and trees without full rendering.
- Renderers can be compared or replaced.
- Parsing and tessellation can move to a Web Worker.

### Negative and Risks

- Entity-to-mesh mapping requires additional design.
- OCCT/XDE WebAssembly may increase download size, memory use, and startup time.
- Kernel object lifetimes require explicit disposal.
- STEP metadata depends on both the source file and the binding.
- STEP export may lose unsupported entities or metadata.

## Alternatives Considered

- `occt-import-js` as the final importer:
  - Useful for a fast mesh prototype.
  - Not sufficient as the complete XDE inspection API by itself.
- `opencascade.js` as the immediate dependency:
  - Broader OCCT access may be useful.
  - XDE coverage, memory behavior, and worker integration need proof.
- Full-model rendering first:
  - Rejected because it delays inspection and increases mobile memory use.
- Direct STEP byte editing:
  - Rejected because STEP is not a safe byte-addressable format.
- Server-side processing:
  - Rejected for the initial local-first workflow.

## Follow-up

- Test one simple part and one assembly fixture.
- Measure WASM size, import time, memory, and disposal.
- Test desktop and mobile browsers.
- Record package versions and results in a follow-up ADR.
- Change this ADR to `Accepted` only after verification.

## References

- [OCCT XDE user guide](https://occt3d.com/dev/doc/overview/html/occt_user_guides__xde.html)
- [OpenCascade.js](https://github.com/donalffons/opencascade.js)
- [occt-import-js](https://github.com/kovacsv/occt-import-js)
- [Three.js documentation](https://threejs.org/docs/)
- [Babylon.js documentation](https://doc.babylonjs.com/)
