import type { GeometryBackend, GeometryTreeSource } from "./geometry-backend";
import {
    createMeshGeometrySession,
    createOcctGeometrySession,
    type GeometrySession,
} from "./geometry-session";
import type { OcctWasmBridge } from "./occt-wasm-bridge";
import type { StepInspection } from "./step";

export const nativeGeometryBackend: GeometryBackend = {
    async loadTree({ fileName, fileSize, content }: GeometryTreeSource) {
        if (!content || content.byteLength === 0) {
            throw new Error("OCCT WASM backend requires file content.");
        }

        return new Promise<GeometrySession>((resolve, reject) => {
            const worker = new Worker(
                new URL("./step.worker.ts", import.meta.url),
                { type: "module" },
            );
            const timeout = window.setTimeout(() => {
                cleanup();
                reject(
                    new Error(
                        "The OCCT WASM worker timed out while reading the STEP file.",
                    ),
                );
            }, 120000);

            const cleanup = () => worker.terminate();
            worker.onmessage = (event: MessageEvent<StepWorkerResponse>) => {
                window.clearTimeout(timeout);
                cleanup();
                if (event.data.ok) {
                    resolve(createMeshGeometrySession(event.data.result));
                } else {
                    reject(new Error(event.data.error));
                }
            };
            worker.onerror = (event) => {
                window.clearTimeout(timeout);
                cleanup();
                reject(
                    new Error(
                        event.message ||
                            "The OCCT WASM worker stopped unexpectedly. Check the browser console for details.",
                    ),
                );
            };
            worker.onmessageerror = () => {
                window.clearTimeout(timeout);
                cleanup();
                reject(
                    new Error("The OCCT WASM worker returned unreadable data."),
                );
            };
            worker.postMessage({ fileName, fileSize, content }, [content]);
        });
    },

    dispose() {
        // The session owns document resources in the future XDE implementation.
    },
};

export function createOcctWasmGeometryBackend(
    bridge: OcctWasmBridge,
): GeometryBackend {
    return {
        async loadTree(source) {
            const opened = await bridge.openStep(source);
            return createOcctGeometrySession(opened, bridge);
        },

        dispose() {
            // Document lifetime is owned by each GeometrySession.
        },
    };
}

type StepWorkerResponse =
    | { ok: true; result: StepInspection }
    | { ok: false; error: string };
