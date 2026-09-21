import {
    createMeshGeometrySession,
    type GeometrySession,
} from "./geometry-session";
import { nativeGeometryBackend } from "./native-geometry-backend";
import type { StepInspection } from "./step";

export interface GeometryTreeSource {
    fileName: string;
    fileSize: number;
    content: ArrayBuffer;
}

export interface GeometryBackend {
    loadTree(source: GeometryTreeSource): Promise<GeometrySession>;
    dispose(): void;
}

export type GeometryBackendKind = "browser" | "native";

export function createGeometryBackend(
    kind: GeometryBackendKind = "native",
): GeometryBackend {
    return kind === "native" ? nativeGeometryBackend : browserGeometryBackend;
}

export const browserGeometryBackend: GeometryBackend = {
    async loadTree({ fileName, fileSize, content }) {
        if (!content || content.byteLength === 0) {
            throw new Error("Browser geometry backend requires file content.");
        }

        return new Promise<GeometrySession>((resolve, reject) => {
            const worker = new Worker(
                new URL("./step.worker.ts", import.meta.url),
                { type: "module" },
            );

            const cleanup = () => worker.terminate();
            worker.onmessage = (event: MessageEvent<StepWorkerResponse>) => {
                cleanup();
                if (event.data.ok) {
                    resolve(createMeshGeometrySession(event.data.result));
                } else {
                    reject(new Error(event.data.error));
                }
            };
            worker.onerror = () => {
                cleanup();
                reject(
                    new Error(
                        "The STEP importer worker stopped unexpectedly. Check the browser console for details.",
                    ),
                );
            };
            worker.onmessageerror = () => {
                cleanup();
                reject(
                    new Error(
                        "The STEP importer returned an unreadable result.",
                    ),
                );
            };
            worker.postMessage({ fileName, fileSize, content }, [content]);
        });
    },

    dispose() {
        // Browser fallback keeps no native resources yet.
    },
};

type StepWorkerResponse =
    | { ok: true; result: StepInspection }
    | { ok: false; error: string };

export async function resolveSelectedGeometry(
    session: GeometrySession,
    entity: Parameters<GeometrySession["loadSelectedNodeGeometry"]>[0],
) {
    return session.loadSelectedNodeGeometry(entity);
}
