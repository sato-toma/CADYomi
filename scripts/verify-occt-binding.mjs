import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const packageJsonPath = require.resolve("opencascade.js/package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const expectedVersion = "1.1.1";

if (packageJson.version !== expectedVersion) {
    throw new Error(
        `Expected opencascade.js ${expectedVersion}, found ${packageJson.version}.`,
    );
}

if (packageJson.license !== "LGPL-2.1-only") {
    throw new Error(
        `Unexpected opencascade.js license: ${packageJson.license ?? "missing"}.`,
    );
}

const wasmPath = require.resolve("opencascade.js").replace(/index\.js$/, "");
if (!existsSync(wasmPath)) {
    throw new Error(`opencascade.js package directory is missing: ${wasmPath}`);
}

console.log(
    `OCCT binding ready: opencascade.js ${packageJson.version} (${packageJson.license})`,
);
console.log(`Package path: ${wasmPath}`);
console.log(
    "Custom XDE bindings require rebuilding the package from its Emscripten sources.",
);
