import { spawnSync } from "node:child_process";
import {
    copyFileSync,
    existsSync,
    mkdirSync,
    readdirSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const testDataDir = join(root, "test-data");
mkdirSync(testDataDir, { recursive: true });

const explicit = (process.env.STEP_TEST_FILE ?? "")
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);

async function trySelectSingleFixture() {
    if (explicit.length > 0) {
        const firstExisting = explicit.find((candidate) =>
            existsSync(candidate),
        );
        return firstExisting ? [firstExisting] : [];
    }

    const stepFiles = readdirSync(testDataDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && /\.(step|stp)$/i.test(entry.name))
        .map((entry) => join(testDataDir, entry.name));

    if (stepFiles.length > 0) {
        return stepFiles.slice(0, 1);
    }

    const zipUrl = process.env.STEP_TEST_URL;
    if (!zipUrl) {
        return [];
    }

    const zipPath = join(testDataDir, "jama-step-cache.zip");
    const extractedDir = join(testDataDir, "jama-step-extracted");
    rmSync(extractedDir, { recursive: true, force: true });

    const response = await fetch(zipUrl);
    if (!response.ok) {
        throw new Error(
            `Failed to download JAMA STEP fixture: ${response.status} ${response.statusText}`,
        );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(zipPath, buffer);

    const pwsh = spawnSync(
        "powershell",
        [
            "-NoLogo",
            "-NoProfile",
            "-Command",
            `Expand-Archive -Path '${zipPath}' -DestinationPath '${extractedDir}' -Force`,
        ],
        { stdio: "inherit" },
    );

    if (pwsh.status !== 0) {
        throw new Error(
            `Failed to extract the JAMA STEP ZIP via PowerShell. Exit code: ${pwsh.status}`,
        );
    }

    const extractedStepFiles = readdirSync(extractedDir, { recursive: true })
        .filter(
            (name) => typeof name === "string" && /\.(step|stp)$/i.test(name),
        )
        .map((name) => join(extractedDir, String(name)));

    if (extractedStepFiles.length === 0) {
        throw new Error(
            "The downloaded JAMA ZIP did not contain any .step/.stp files.",
        );
    }

    const selectedPath = join(testDataDir, "selected-step.step");
    copyFileSync(extractedStepFiles[0], selectedPath);
    return [selectedPath];
}

const chosen = await trySelectSingleFixture();
if (chosen.length === 0) {
    console.log(
        "No STEP file is available for local or CI verification. Skipping importer verification.",
    );
    process.exit(0);
}

process.env.STEP_TEST_FILE = chosen[0];

const vitestBin = join(root, "node_modules", "vitest", "vitest.mjs");
const child = spawnSync(
    process.execPath,
    [vitestBin, "run", "src/step.test.ts"],
    {
        stdio: "inherit",
        env: process.env,
    },
);

if (child.status !== 0) {
    process.exit(child.status ?? 1);
}
