import { mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const targetDir = join(process.cwd(), "test-data");
mkdirSync(targetDir, { recursive: true });

const stepFiles = readdirSync(targetDir)
    .filter((name) => /\.(step|stp)$/i.test(name))
    .sort();

if (stepFiles.length > 0) {
    console.log(`Found local STEP fixture: ${stepFiles[0]}`);
    process.exit(0);
}

if (process.env.STEP_TEST_URL) {
    throw new Error(
        "This project intentionally does not auto-download JAMA role-model STEP files. Place the file manually in test-data/ for local verification only.",
    );
}

console.log(
    "No local STEP fixture found. This test is skipped unless the user places a file in test-data/ manually.",
);
