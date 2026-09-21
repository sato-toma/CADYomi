import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import occtImportJs from "occt-import-js";
import { describe, expect, it } from "vitest";
import {
    browserGeometryBackend,
    resolveSelectedGeometry,
} from "./geometry-backend";
import { createInspectionFromOcct } from "./step";

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

        const preview = await browserGeometryBackend.loadSelectedNodeGeometry(
            inspection,
            inspection.entities[1],
        );

        expect(preview).toHaveLength(2);
        expect(preview.map((mesh) => mesh.name)).toEqual(["mesh-1", "mesh-2"]);

        const bounds = await browserGeometryBackend.loadPreviewBoundingBox(
            inspection,
            inspection.entities[1],
        );

        expect(bounds.size.x).toBeGreaterThan(0);
        expect(bounds.size.y).toBeGreaterThanOrEqual(0);
        expect(bounds.center.x).toBeGreaterThanOrEqual(0);
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
