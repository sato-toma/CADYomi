import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import occtImportJs from "occt-import-js";
import { describe, expect, it } from "vitest";
import { createInspectionFromOcct } from "./step";

const fixturePath = (() => {
    const explicit = (process.env.STEP_TEST_FILE ?? "")
        .split(/[;,]/)
        .map((value) => value.trim())
        .filter(Boolean);

    if (explicit.length > 0) {
        const firstExisting = explicit.find((candidate) =>
            existsSync(candidate),
        );
        return firstExisting ?? null;
    }

    const candidates = [
        join(process.cwd(), "test-data", "selected-step.step"),
        join(process.cwd(), "test-data", "sample.step"),
        join(process.cwd(), "test-data", "sample.stp"),
    ];

    return candidates.find((candidate) => existsSync(candidate)) ?? null;
})();

describe("STEP smoke test", () => {
    it("loads a small STEP fixture without failing the import contract", async () => {
        if (!fixturePath) {
            console.warn(
                "No fixture is available for the smoke test. Skipping the light validation.",
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
    }, 30000);
});
