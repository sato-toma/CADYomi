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
  - STEPcode
  - Three.js
  - Babylon.js

## Decision Drivers

- Preserve CAD structure and inspection metadata.
- Keep CAD files local by default.
- Support progressive loading on mobile.
- Keep importer and renderer implementations replaceable.
- Select a library through a representative proof of concept.
- Prefer permissive licensing, but do not ignore CAD-kernel license obligations.
- Avoid replacing one memory-heavy full-file parse with another.

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
- Treat LGPL-2.1 as an acceptable candidate license after license review.
- Use `occt-import-js` as the first STEP importer proof-of-concept candidate.
- Keep it behind the importer adapter and do not make its result the application model.
- Do not accept it as the production importer until large-file memory and metadata tests pass.

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
- A permissive-license parser may require a custom WebAssembly build and add substantial maintenance cost.

## Alternatives Considered

### Maintenance Assessment (2026-09-20)

| Candidate | Maintenance signal | Why it is not the sole production choice yet |
| --- | --- | --- |
| `occt-import-js` | Latest release `0.0.23`; repository activity is about two years old | Browser-ready, but API surface is narrow and it tessellates during STEP import; large-file memory must be measured |
| `opencascade.js` | Latest npm release `1.1.1` is about six years old; OCCT 7.4.0-era package | Broad OCCT access, but old distribution, incomplete/untested bindings, and heavier integration |
| STEPcode | Active repository development and BSD-3-Clause license | C++/Python-oriented; no maintained browser/WASM package for this application |
| xeokit | Active releases and maintenance | AGPL-3.0, viewer/BIM SDK rather than a STEP parser |

No candidate currently satisfies all of these requirements at once:

- Active maintenance
- Browser/WASM support
- STEP parsing
- XDE-like structure and metadata
- Acceptable license
- Predictable large-file memory behavior

Therefore, `occt-import-js` is selected for the first browser PoC, not accepted as the final production importer.

- `occt-import-js` as the final importer:
  - Useful for a fast mesh prototype.
  - Not sufficient as the complete XDE inspection API by itself.
  - LGPL-2.1; acceptable as a candidate after license review.
- `opencascade.js` as the immediate dependency:
  - Broader OCCT access may be useful.
  - XDE coverage, memory behavior, and worker integration need proof.
  - LGPL-2.1-only; acceptable as a candidate after license review.
- STEPcode as a browser dependency:
  - 3-clause BSD and therefore permissively licensed.
  - Primarily a C++ library; browser use requires a maintained WebAssembly build and JavaScript bindings.
  - Does not automatically provide OCCT/XDE geometry, tessellation, or XDE metadata services.
- xeokit as the importer:
  - AGPL-3.0 and focused on viewing converted BIM data.
  - Not a STEP parser; rejected for this importer boundary.
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
