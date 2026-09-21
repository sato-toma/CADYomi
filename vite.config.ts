import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function openCascadeWasmAsset(): Plugin {
    const wasmPath = resolve(
        process.cwd(),
        "node_modules/opencascade.js/dist/opencascade.wasm.wasm",
    );
    const virtualId = "\0opencascade-wasm-asset";

    return {
        name: "opencascade-wasm-asset",
        enforce: "pre",
        resolveId(source: string) {
            return source.endsWith("opencascade.wasm.wasm")
                ? virtualId
                : undefined;
        },
        load(id: string) {
            if (id !== virtualId) {
                return undefined;
            }

            if (process.env.NODE_ENV === "production") {
                const assetId = this.emitFile({
                    type: "asset",
                    name: "opencascade.wasm",
                    source: readFileSync(wasmPath),
                });
                return `export default import.meta.ROLLUP_FILE_URL_${assetId};`;
            }

            return `export default ${JSON.stringify(
                "/node_modules/opencascade.js/dist/opencascade.wasm.wasm",
            )};`;
        },
    };
}

export default defineConfig({
    plugins: [openCascadeWasmAsset(), react()],
    assetsInclude: ["**/*.wasm"],
    optimizeDeps: {
        exclude: ["opencascade.js"],
    },
    server: {
        host: "0.0.0.0",
        port: 5173,
    },
    preview: {
        host: "0.0.0.0",
        port: 4173,
    },
});
