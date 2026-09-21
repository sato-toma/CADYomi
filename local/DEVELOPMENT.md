# CADYomi Development Plan

## 1. Project Overview

CADYomi is a browser-based CAD inspection tool.

The initial goal is intentionally small:

> Load a STEP file locally, understand its structure, and inspect it progressively on desktop and mobile browsers.

The project should be designed so that the current viewer implementation can eventually be replaced without requiring the entire application architecture to be rewritten.

The first release targets **STEP files only** and is deployed as a web application on **Vercel**. A full 3D viewport is not required before the model tree and properties can be inspected.

Future goals include:

* Support for major CAD file formats
* Windows distribution
* Android distribution
* Potential desktop or native implementations
* Replaceable rendering/viewer implementations
* Local AI agent API for analysis and, later, editing
* User-provided plugins
* Extensible processing pipelines

These future goals should influence architectural decisions, but should **not unnecessarily complicate the initial implementation**.

---

## 2. Current Scope

### Target platform

Current:

* Web browser
* Vercel

Future:

* Windows
* Android
* Other platforms if appropriate

Do not implement native Windows or Android support during the initial development unless there is a clear technical reason.

The initial implementation should remain as close to standard web technologies as possible.

---

## 3. Current Input Format

The initial supported CAD format is:

* STEP

Potential future formats include:

* IGES
* STL
* OBJ
* FBX
* JT
* glTF / GLB
* Other major CAD or 3D formats

Do not implement these additional formats yet.

However, the architecture should avoid making STEP handling inseparable from the entire application.

The application should have a conceptual input pipeline such as:

```text
File
  ↓
Importer
  ↓
Internal Model / Geometry Representation
  ↓
Viewer / Renderer
```

STEP is the first implementation of the importer.

---

## 4. Inspection and Viewer Strategy

The first goal is:

> Make the model understandable before making the whole model visible.

The initial inspection flow is:

```text
Select local STEP file
  -> read metadata and entity hierarchy
  -> show table/tree and properties
  -> tessellate only the selected entity or subtree
  -> optionally display the selected geometry
```

Full-model rendering is an optional later view, not a prerequisite for opening a file.

The viewer should support basic operations such as:

* Orbit / rotate
* Pan
* Zoom
* Fit model to view
* Reset camera
* Basic visibility control if practical
* Selected-entity or selected-subtree display

The viewer implementation is considered replaceable.

### Important architectural principle

The viewer should eventually be disposable.

Do not design the entire application around a specific rendering library or CAD kernel.

For example, avoid spreading Three.js, OpenCascade, or another rendering/CAD implementation throughout unrelated application code.

Prefer boundaries such as:

```text
Application
    ↓
  Inspection Model and Viewer Interfaces
    ↓
Current Viewer Implementation
    ↓
  Rendering Library / CAD Kernel
```

The current implementation may use whatever technology is most practical, but the rest of the application should depend on abstractions where doing so is reasonable.

Do not create excessive abstraction solely for theoretical future requirements.

---

## 5. Processing Location

The initial design should prefer **client-side processing**.

The STEP file should ideally remain on the user's device.

Preferred architecture:

```text
User
  ↓
Browser
  ├── STEP file
  ├── parser / CAD kernel
  ├── metadata and entity index
  ├── selected geometry conversion
  └── optional WebGL rendering
      ↓
    Inspection UI
```

The Vercel server should primarily distribute the application.

A database is **not required** for the initial application.

Do not introduce a backend or database unless a future feature genuinely requires one.

### Privacy principle

CAD files may contain sensitive design information.

Therefore:

> Do not upload STEP files to a server unless the user explicitly requests or enables such functionality.

Client-side processing is preferred whenever technically practical.

---

## 6. Technology Stack

The preferred initial stack is:

* TypeScript
* React
* Redux only when centralized state is demonstrated to be useful
* redux-saga only when a real asynchronous workflow requires it
* Vite
* Web APIs
* Web Workers where appropriate
* WebAssembly where appropriate
* WebGL / WebGPU where appropriate

The project should remain primarily web-based.

### OCCT WASM binding

The repository pins `opencascade.js@1.1.1` as the OSS OCCT/Emscripten binding
source for the future XDE bridge. Verify that the package is installed with:

```sh
npm run verify:occt
```

The package is LGPL-2.1-only and is based on OCCT 7.4.0. The TypeScript
bridge contract lives in `src/occt-wasm-bridge.ts`. A custom XDE build should
keep the same `openStep`, `getEntityBounds`, `tessellateEntity`, and
`releaseDocument` operations.

For custom C++ bindings, use the source included in `node_modules/opencascade.js`
as the starting point. Add missing OCCT/XDE bindings under its `embind/`
sources, rebuild with the package's Docker/Emscripten workflow, and then run
`npm run verify:occt` before connecting the generated module.

### C++

C++ is allowed when genuinely necessary.

Possible use cases include:

* CAD kernel integration
* STEP parsing
* Computational geometry
* Performance-critical processing
* WebAssembly modules

However:

> Prefer TypeScript and existing web technologies first.

Do not introduce C++ merely because a native implementation might be faster.

The default architecture should remain buildable and understandable as a web application.

---

## 7. State Management

Use Redux for application state only where centralized state is useful.

Use redux-saga only when its orchestration value is demonstrated by a concrete workflow.

Examples:

```text
File selection
    ↓
Import request
    ↓
STEP parsing
    ↓
Geometry conversion
    ↓
Viewer update
```

Saga may coordinate these operations.

Avoid putting large geometry objects directly into Redux state if this causes unnecessary copying, serialization, memory usage, or performance problems.

Large binary data, meshes, WebGL resources, CAD kernel objects, and similar objects may be managed outside Redux when appropriate.

Redux should represent application state and commands, not necessarily every internal object.

---

## 8. Plugin Architecture

Plugin support is an important long-term design goal.

The application should eventually allow users to add functionality without modifying the core application.

The built-in features should be treated partly as **reference implementations / sample plugins**.

Conceptually:

```text
                Core Application
                       │
                 Plugin API
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
     Built-in       User Plugin   User Plugin
      Plugin A         A             B
```

Potential future plugin examples:

* Measurement
* Distance measurement
* Bounding box
* Section view
* Face selection
* Edge selection
* Model tree
* Property inspection
* Color modification
* Visibility control
* Export
* Format conversion
* Geometry analysis
* Custom visualization
* Custom UI panels

### Plugin principle

A feature should be considered a candidate for a plugin if it does not need to be part of the fundamental application infrastructure.

For example:

```text
Core
 ├── File handling infrastructure
 ├── Model lifecycle
 ├── Viewer lifecycle
 ├── Selection infrastructure
 ├── Plugin API
 └── Basic application UI

Plugins
 ├── Measurement
 ├── Model information
 ├── Section
 ├── Analysis
 └── Custom tools
```

The exact boundary should be determined pragmatically.

Do not build a complicated plugin marketplace, package manager, or remote plugin installation system in the initial release.

First establish a simple and stable plugin interface.

---

## 9. Plugin Design Goals

A plugin should ideally be able to:

* Add UI
* Register commands
* Access the current model
* Access selection information
* Request viewer operations
* React to application events
* Perform model processing
* Provide custom visualization
* Store plugin-specific state

Potential conceptual API:

```typescript
interface ViewerPlugin {
    id: string;
    name: string;

    initialize(context: PluginContext): void;
    dispose(): void;
}
```

This is only a conceptual example.

Do not implement this exact interface unless it fits the actual architecture.

The plugin API should be designed based on real use cases encountered during development.

---

## 10. Rendering Architecture

The viewer should separate:

1. CAD model representation
2. Geometry conversion / tessellation
3. Rendering
4. Camera
5. Selection
6. UI

Conceptually:

```text
STEP
 ↓
STEP Importer
 ↓
CAD / Geometry Representation
 ↓
Tessellation / Mesh Generation
 ↓
Viewer Model
 ↓
Renderer
 ↓
WebGL / WebGPU
```

The renderer should not need to understand STEP syntax.

Likewise, the STEP importer should not need to know about React components.

---

## 11. Performance

STEP processing may be CPU-intensive.

Potential bottlenecks include:

* STEP parsing
* CAD topology construction
* B-Rep processing
* Tessellation
* Mesh generation
* Large assemblies
* Large numbers of triangles
* Memory consumption

The application should avoid blocking the browser's main UI thread during expensive processing whenever practical.

Prefer:

```text
Main Thread
    │
    ├── React UI
    └── Viewer
          ↑
          │
      Web Worker
          │
          └── STEP processing
```

Use Web Workers for expensive operations when the selected CAD library supports this architecture.

Performance optimizations should be based on measurement.

Do not prematurely optimize.

---

## 12. Development Milestones

The first milestone should be intentionally small.

### Milestone 0 — Project Setup

* Create TypeScript project
* Configure React
* Configure Vite
* Configure linting / formatting
* Configure build
* Configure GitHub repository
* Configure Vercel deployment
* Add Redux only if centralized state is needed
* Add redux-saga only if a concrete asynchronous workflow benefits from it

### Milestone 1 — Local STEP Model Index

Implement:

* Application shell
* File selection
* STEP file loading
* STEP parsing
* Metadata extraction
* Stable entity identifiers
* Entity tree or table
* Selected entity properties
* Invalid-file and unsupported-entity errors

Success criteria:

> A user can select a local STEP file and inspect its structure and properties without loading a full 3D scene.

### Milestone 2 — Selected Geometry

Add:

* Selected-entity tessellation
* Selected-subtree rendering
* Replaceable viewer interface
* Orbit, pan, zoom, and fit for the selected geometry
* Geometry cancellation and disposal
* Desktop and mobile viewport handling

### Milestone 3 — Importer and Worker Boundaries

Establish:

* Importer boundary
* Common inspection model
* Format capability reporting
* Application state boundary
* Worker boundary where appropriate
* Import progress and cancellation
* Initial plugin API only where a concrete feature needs it

Do not add a second file format or a full renderer abstraction without implementation evidence.

### Milestone 4 — First Inspection Plugin

Implement one useful feature as a plugin.

For example:

* Model information
* Bounding box
* Selection highlight
* Measurement

The purpose of this milestone is to validate that the plugin architecture is actually usable.

### Milestone 5 — Local Agent API

Document and implement the first read-only operation:

* Capability discovery
* Entity tree query
* Entity properties
* Selected-subtree analysis
* Progress and cancellation

Create the machine-readable contract before implementation. Compare MCP and local HTTP/OpenAPI with a real client before selecting the first transport.

Editing, change sets, and export are later milestones.

### Milestone 6 — Deployment

Deploy the viewer to Vercel.

The application should be usable through a public URL.

No database is required.

No server-side STEP processing is required.

---

## 13. Error Handling

The viewer should gracefully handle:

* Invalid STEP files
* Unsupported STEP entities
* Corrupted files
* Extremely large files
* Memory exhaustion where detectable
* CAD kernel errors
* WebAssembly initialization failures
* WebGL initialization failures
* Browser compatibility problems

A failure to load a model should not crash the entire React application.

Error information should be understandable to users while allowing developers to obtain useful diagnostic information.

---

## 14. Security and Privacy

STEP files should be treated as potentially sensitive user data.

Initial requirements:

* Do not upload STEP files to a server.
* Do not persist STEP files remotely.
* Do not send CAD data to third-party services without explicit user action.
* Avoid unnecessary telemetry.
* Do not store model data in localStorage unless there is a specific reason.
* Clearly separate application assets from user-provided CAD data.

If future functionality requires server-side processing, make it an explicit opt-in feature.

---

## 15. Licensing

The project should initially use a permissive license.

Prefer licenses such as:

* MIT
* BSD 2-Clause
* BSD 3-Clause
* Apache License 2.0

The exact license should be selected based on the dependencies used by the project.

Third-party dependencies must be reviewed individually.

Do not assume that the project's license automatically applies to third-party libraries or CAD kernels.

Maintain a clear record of:

* Direct dependencies
* Their licenses
* Their copyright notices
* Redistribution requirements

If a dependency has a restrictive license, evaluate it before making it part of the distributable application.

---

## 16. Dependency Policy

Prefer:

1. Mature open-source libraries
2. Permissive licenses
3. Browser-compatible implementations
4. Active maintenance
5. Reasonable bundle size
6. Libraries that can potentially be replaced later

Avoid introducing dependencies without a clear purpose.

When choosing between two libraries, consider:

* License
* Browser compatibility
* WASM support
* Performance
* STEP compatibility
* Bundle size
* Maintenance status
* API stability
* Ability to replace the library later

---

## 17. Future Distribution

The current distribution target is:

```text
Vercel
  ↓
Web browser
```

Future targets may include:

```text
Web
 ↓
Vercel

Windows
 ↓
Desktop application
 ↓
Potentially Steam / Microsoft Store / direct distribution

Android
 ↓
Android application
 ↓
Potentially Google Play / direct distribution
```

The application should not depend unnecessarily on Vercel-specific APIs.

The core viewer should ideally be capable of running as a static web application.

This makes future packaging into desktop or mobile applications easier.

---

## 18. Future CAD Format Support

The long-term goal is to support major CAD formats.

Possible future architecture:

```text
                CAD Input
                    │
       ┌────────────┼────────────┐
       ↓            ↓            ↓
     STEP         IGES          JT
       │            │            │
       └────────────┼────────────┘
                    ↓
           Common Inspection Model
                    ↓
           Inspection UI / Agent API
```

    Do not implement a universal CAD abstraction prematurely. Define the smallest common inspection model from actual STEP and later importer experience.

    First make STEP model indexing and selected geometry work correctly.

When a second format is actually implemented, use the experience from the second importer to determine which abstractions are genuinely common.

    Each format adapter must report:

    * Supported file extensions
    * Available hierarchy and metadata
    * Whether tessellation is available
    * Whether editing or export is supported
    * Unsupported entities or properties

    Candidate future formats are IGES, STL, OBJ, FBX, JT, and glTF/GLB. They remain out of the initial implementation.

    ## 18.1 Local Agent API

    The local agent API is a separate boundary from the importer and renderer.

    Initial rules:

    * Keep the API local-first and do not upload CAD files by default.
    * Document each operation before implementation.
    * Use JSON Schema for shared payloads.
    * Use OpenAPI 3.1 for HTTP or evaluate MCP for agent-native tools and resources.
    * Keep TOML for configuration, not API contracts.
    * Start with read-only capability, entity, property, and selected-subtree analysis operations.
    * Treat editing as a validated change set and export a new file.

    The contract and schema rules live in [docs/api/README.md](../docs/api/README.md) and [ADR 0002](../docs/adr/0002-format-adapters-and-local-agent-api.md).

---

## 19. Development Principles

### Principle 1 — Make the model understandable first

The first priority is:

> Load a STEP file and inspect its structure and properties.

Do not spend excessive time building abstractions before a working model index exists. Do not make full-model rendering a prerequisite.

### Principle 2 — Keep the core small

The core application should provide infrastructure rather than every possible CAD feature.

### Principle 3 — Prefer plugins for optional functionality

If a feature can reasonably be implemented as a plugin, consider doing so.

Built-in plugins should serve as examples of what users can extend.

### Principle 4 — Web first

Prefer browser technologies.

Use C++ / WebAssembly only when there is a demonstrated technical need.

### Principle 5 — No unnecessary backend

Do not add a database or server unless a feature requires it.

### Principle 6 — Protect user CAD data

Prefer local processing.

### Principle 7 — Measure before optimizing

Do not optimize based solely on assumptions.

### Principle 8 — Keep future replacement possible

The current STEP importer and viewer implementation should not become inseparable from the rest of the application.

### Principle 9 — Avoid speculative architecture

Future requirements should influence boundaries, but should not result in large amounts of unused infrastructure.

### Principle 10 — Document contracts before APIs

Record API schemas, capabilities, side effects, revisions, and errors before implementing local agent operations.

### Principle 11 — Separate structure parsing from tessellation

The importer should provide structure and property inspection as quickly as possible.

Do not require full geometry tessellation for the initial inspection workflow. The UI should be able to show the assembly tree, entity metadata, and property records before full mesh generation is complete.

### Principle 12 — Load geometry lazily

Geometry generation should be triggered by user selection or a clearly defined preview workflow, not during the first file read.

This keeps early loading fast and allows the viewer to show a lightweight placeholder or a simple bounding-volume preview while heavier geometry is generated in the background.

### Principle 13 — Prefer a native geometry boundary when the browser layer becomes the bottleneck

If the browser importer cannot keep the inspection flow responsive, move the heavy geometry and tessellation work behind a native or WebAssembly boundary.

A C++ / OCCT WASM layer is acceptable when the technical need is proven. The browser layer should remain a UI and orchestration layer, not the place where all CAD processing is forced to live.

### Principle 14 — Keep model understanding, geometry, and rendering as separate responsibilities

The system should separate:

* assembly and property parsing
* selected-node geometry loading
* tessellation and mesh generation
* viewer rendering and selection feedback

This allows a lighter inspection workflow now and a stronger native geometry backend later without rewriting the application architecture.

---

## 20. Development Plan for Lightweight STEP Inspection

The initial product goal is not a full CAD renderer. The first goal is a fast, usable inspection workflow.

Priority shift for the next implementation stage:

1. Treat the C++ / OCCT WebAssembly path as the priority architecture for heavy geometry work.
2. Keep the browser layer focused on inspection, selection, and viewer orchestration.
3. Use browser-only parsing only as a temporary fallback or lightweight prototype while the native path is being prepared.
4. Use lazy geometry generation for selected nodes rather than importing and tessellating the entire model on the first pass.
5. Keep a simple bounding-box or placeholder preview while the heavier geometry is loading in the background.

Immediate roadmap:

1. Define a clear importer boundary with separate responsibilities for structure parsing, property access, and geometry tessellation.
2. Build a native geometry adapter around C++ / OCCT and expose a minimal WebAssembly interface for reading STEP structure and selected-node geometry.
3. Keep the browser UI responsible for the assembly tree, property inspection, and selection flow.
4. Use the browser preview layer only for lightweight 3D display and user interactions. The heavy CAD work remains behind the native geometry boundary.
5. Connect selected-node requests to the native layer and render the result in the viewer without blocking the initial inspection flow.
6. Add a simplified preview pass for fast bounding-box or box placeholder display if the native tessellation is still working in the background.
7. Keep the viewer and renderer replaceable as the native geometry boundary evolves.

This strategy moves the project toward a realistic long-term architecture while preserving a fast inspection workflow in the browser.

---

## 21. Definition of Done for the Initial Version

The initial version is considered successful when:

* [ ] The project builds successfully
* [ ] The application runs locally
* [ ] The application deploys to Vercel
* [ ] A user can select a local STEP file
* [ ] The STEP file is processed in the browser
* [ ] Model metadata and an entity tree/table are available before full rendering
* [ ] Selected entity properties are available
* [ ] Selected entity or subtree geometry can be loaded on demand
* [ ] The selected geometry can be displayed in 3D
* [ ] The camera can orbit, pan, zoom, and fit selected geometry
* [ ] Invalid files do not crash the application
* [ ] STEP data is not uploaded to a server
* [ ] No database is required
* [ ] The application works on a modern desktop browser
* [ ] The application is usable on Android Chrome where practical
* [ ] The codebase has a clear separation between application UI, format importing, inspection model, viewer logic, and rendering
* [ ] At least one simple plugin can be implemented without modifying unrelated core code
* [ ] The first local agent API operation has a documented machine-readable contract

---

## 21. Copilot Instructions

When implementing this project:

1. Follow this development plan as the architectural guideline.
2. Prefer the smallest implementation that satisfies the current requirement.
3. Do not implement future features unless explicitly requested.
4. Do not add a backend or database without a concrete requirement.
5. Prefer client-side processing of STEP files.
6. Keep CAD processing separate from React UI.
7. Avoid putting large CAD objects or meshes into Redux state.
8. Use redux-saga only for application-level asynchronous workflows where it is useful.
9. Use Web Workers for CPU-intensive processing when practical.
10. Prefer TypeScript and browser technologies.
11. Use C++ only when a web implementation is insufficient for a real technical requirement.
12. Keep the viewer implementation replaceable.
13. Keep STEP-specific logic isolated from generic viewer functionality.
14. Prefer plugin implementations for optional user-facing features.
15. Do not create an elaborate plugin system before there is a concrete plugin use case.
16. Check dependency licenses before introducing new dependencies.
17. Favor permissive open-source licenses.
18. Do not upload user CAD files without explicit user action.
19. Avoid Vercel-specific APIs unless they are genuinely necessary.
20. Prioritize a working STEP inspection workflow over architectural perfection.

---

## 22. First Task

Start by creating the minimum viable STEP inspection workflow.

Do not implement measurements, editing, cloud storage, user accounts, online sharing, databases, or full-model rendering yet.

The first implementation should achieve:

```text
Open Web App
      ↓
Select STEP File
      ↓
Process STEP Locally
      ↓
Build Metadata and Entity Index
      ↓
Show Entity Tree/Table and Properties
      ↓
Optionally Request Selected Geometry
```

After this works reliably, add selected geometry, then evaluate importer and renderer choices based on actual implementation experience before adding other formats or editing.
