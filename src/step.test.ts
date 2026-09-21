import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import occtImportJs from "occt-import-js";
import { describe, expect, it } from "vitest";
import {
    browserGeometryBackend,
    createGeometryBackend,
} from "./geometry-backend";
import { createMeshGeometrySession } from "./geometry-session";
import {
    createOcctWasmGeometryBackend,
    nativeGeometryBackend,
} from "./native-geometry-backend";
import { createInspectionFromOcct } from "./step";
import { createMetadataInspection } from "./step-metadata";

const fixturePaths = (() => {
    const explicit = (process.env.STEP_TEST_FILE ?? "")
        .split(/[;,]/)
        .map((value) => value.trim())
        .filter(Boolean);

    if (explicit.length > 0) {
        return explicit.filter((candidate) => existsSync(candidate));
    }

    const candidates = [
        join(process.cwd(), "test-data", "selected-step.step"),
        join(process.cwd(), "test-data", "step-fixture.step"),
        join(process.cwd(), "test-data", "sample.step"),
        join(process.cwd(), "test-data", "sample.stp"),
    ];

    const discovered = readdirSync(join(process.cwd(), "test-data"), {
        withFileTypes: true,
    })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .filter((name) => /\.(step|stp)$/i.test(name))
        .map((name) => join(process.cwd(), "test-data", name));

    const unique = [...new Set([...candidates, ...discovered])];
    return unique.filter((candidate) => candidate && existsSync(candidate));
})();

describe("STEP import contract", () => {
    it("creates a metadata inspection without tessellated meshes", () => {
        const content = new TextEncoder().encode(
            "ISO-10303-21;#10=PRODUCT('ENGINE','',(#20));#20=PRODUCT_DEFINITION_FORMATION('', '', #30);",
        ).buffer;
        const inspection = createMetadataInspection(
            "assembly.step",
            content.byteLength,
            content,
        );

        expect(inspection.importer).toBe("step-metadata");
        expect(inspection.meshes).toBeUndefined();
        expect(inspection.entities[0]).toMatchObject({
            id: "step:10",
            name: "ENGINE",
            type: "PRODUCT",
        });
    });

    it("keeps native backend selection behind the shared factory", () => {
        expect(createGeometryBackend("browser")).toBe(browserGeometryBackend);
        expect(createGeometryBackend("native")).toBe(nativeGeometryBackend);
    });

    it("resolves a selected node through the geometry backend adapter", async () => {
        const inspection = createInspectionFromOcct("demo.step", 12, {
            success: true,
            root: {
                name: "Root",
                meshes: [0],
                children: [
                    {
                        name: "Part A",
                        meshes: [1, 2],
                        children: [],
                    },
                    {
                        name: "Part B",
                        meshes: [],
                        children: [],
                    },
                ],
            },
            meshes: [
                {
                    name: "mesh-0",
                    attributes: { position: { array: [0, 0, 0] } },
                    index: { array: [0, 1, 2] },
                },
                {
                    name: "mesh-1",
                    attributes: { position: { array: [1, 0, 0] } },
                    index: { array: [0, 1, 2] },
                },
                {
                    name: "mesh-2",
                    attributes: { position: { array: [2, 0, 0] } },
                    index: { array: [0, 1, 2] },
                },
            ],
        });

        const session = createMeshGeometrySession(inspection);
        const preview = await session.loadSelectedNodeGeometry(
            inspection.entities[1],
        );

        expect(preview).toHaveLength(2);
        expect(preview.map((mesh) => mesh.name)).toEqual(["mesh-1", "mesh-2"]);

        const bounds = await session.loadPreviewBoundingBox(
            inspection.entities[1],
        );

        expect(bounds.size.x).toBeGreaterThan(0);
        expect(bounds.size.y).toBeGreaterThanOrEqual(0);
        expect(bounds.center.x).toBeGreaterThanOrEqual(0);
    });

    it("tessellates only the selected entity through an OCCT document bridge", async () => {
        const calls: string[] = [];
        const bridge = {
            async openStep() {
                return {
                    documentHandle: "document-1",
                    inspection: {
                        fileName: "assembly.step",
                        fileSize: 10,
                        header: [],
                        entities: [
                            {
                                id: "0.1",
                                type: "GEOMETRY_NODE",
                                raw: "",
                                meshIndices: [],
                            },
                        ],
                        importer: "occt-xde-wasm" as const,
                    },
                };
            },
            async getEntityBounds(documentHandle: string, entityId: string) {
                calls.push(`bounds:${documentHandle}:${entityId}`);
                return {
                    center: { x: 1, y: 2, z: 3 },
                    size: { x: 4, y: 5, z: 6 },
                };
            },
            async tessellateEntity(documentHandle: string, entityId: string) {
                calls.push(`tessellate:${documentHandle}:${entityId}`);
                return [];
            },
            releaseDocument(documentHandle: string) {
                calls.push(`release:${documentHandle}`);
            },
        };

        const backend = createOcctWasmGeometryBackend(bridge);
        const session = await backend.loadTree({
            fileName: "assembly.step",
            fileSize: 10,
            content: new ArrayBuffer(0),
        });
        const entity = session.inspection.entities[0];

        await session.loadSelectedNodeGeometry(entity);
        await session.loadPreviewBoundingBox(entity);
        session.dispose();
        session.dispose();

        expect(calls).toEqual([
            "tessellate:document-1:0.1",
            "bounds:document-1:0.1",
            "release:document-1",
        ]);
    });

    it("includes mesh references on selected tree nodes", () => {
        const inspection = createInspectionFromOcct("demo.step", 12, {
            success: true,
            root: {
                name: "Root",
                meshes: [0],
                children: [
                    {
                        name: "Part A",
                        meshes: [1, 2],
                        children: [],
                    },
                    {
                        name: "Part B",
                        meshes: [],
                        children: [],
                    },
                ],
            },
            meshes: [
                { name: "mesh-0" },
                { name: "mesh-1" },
                { name: "mesh-2" },
            ],
        });

        expect(inspection.entities).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: "0",
                    type: "GEOMETRY_NODE",
                    meshIndices: [0],
                }),
                expect.objectContaining({
                    id: "0.0",
                    type: "GEOMETRY_NODE",
                    meshIndices: [1, 2],
                }),
                expect.objectContaining({
                    id: "0.1",
                    type: "ASSEMBLY_NODE",
                    meshIndices: [],
                }),
            ]),
        );
    });

    it.each(fixturePaths.length > 0 ? fixturePaths : [null])(
        "parses a valid STEP file and yields a non-empty model tree: %s",
        async (fixturePath) => {
            if (!fixturePath) {
                console.warn(
                    "No STEP fixture configured. Skipping importer contract test. Set STEP_TEST_FILE or place .step/.stp files in test-data/.",
                );
                return;
            }

            const fileName = fixturePath.split(/[\\/]/).pop() ?? "fixture.step";
            const content = readFileSync(fixturePath);
            const occt = await occtImportJs();
            const result = occt.ReadStepFile(content, {
                linearUnit: "millimeter",
                linearDeflectionType: "bounding_box_ratio",
                linearDeflection: 0.001,
                angularDeflection: 0.5,
            });

            expect(result.success).toBe(true);

            const inspection = createInspectionFromOcct(
                fileName,
                content.length,
                result,
            );

            expect(inspection.fileName).toBe(fileName);
            expect(inspection.fileSize).toBe(content.length);
            expect(inspection.entities.length).toBeGreaterThan(0);
            expect(
                inspection.entities.some(
                    (entity) =>
                        entity.type === "GEOMETRY_NODE" ||
                        entity.type === "ASSEMBLY_NODE",
                ),
            ).toBe(true);
        },
        180000,
    );
});
