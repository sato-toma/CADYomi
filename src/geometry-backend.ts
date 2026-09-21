import type { StepEntity, StepInspection, StepMeshData } from "./step";

export interface GeometryTreeSource {
    fileName: string;
    fileSize: number;
    content: ArrayBuffer;
}

export interface GeometryBounds {
    center: { x: number; y: number; z: number };
    size: { x: number; y: number; z: number };
}

export interface GeometryBackend {
    loadTree(source: GeometryTreeSource): Promise<StepInspection>;
    loadSelectedNodeGeometry(
        inspection: StepInspection,
        entity: StepEntity,
    ): Promise<StepMeshData[]>;
    loadPreviewBoundingBox(
        inspection: StepInspection,
        entity: StepEntity,
    ): Promise<GeometryBounds>;
    dispose(): void;
}

export type GeometryPreview = StepMeshData[];

export const browserGeometryBackend: GeometryBackend = {
    async loadTree({ fileName, fileSize, content }) {
        if (!content || content.byteLength === 0) {
            throw new Error("Browser geometry backend requires file content.");
        }

        return new Promise<StepInspection>((resolve, reject) => {
            const worker = new Worker(
                new URL("./step.worker.ts", import.meta.url),
                { type: "module" },
            );

            const cleanup = () => worker.terminate();
            worker.onmessage = (event: MessageEvent<StepWorkerResponse>) => {
                cleanup();
                if (event.data.ok) {
                    resolve(event.data.result);
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

    async loadSelectedNodeGeometry(inspection, entity) {
        return entity.meshIndices
            .map((meshIndex) => inspection.meshes[meshIndex])
            .filter((mesh): mesh is StepMeshData => Boolean(mesh));
    },

    async loadPreviewBoundingBox(inspection, entity) {
        const meshes = await this.loadSelectedNodeGeometry(inspection, entity);

        if (meshes.length === 0) {
            return {
                center: { x: 0, y: 0, z: 0 },
                size: { x: 0, y: 0, z: 0 },
            };
        }

        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let minZ = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;
        let maxZ = Number.NEGATIVE_INFINITY;

        for (const mesh of meshes) {
            const positions = mesh.attributes.position.array;
            for (let index = 0; index < positions.length; index += 3) {
                const x = positions[index];
                const y = positions[index + 1];
                const z = positions[index + 2];

                if (
                    !Number.isFinite(x) ||
                    !Number.isFinite(y) ||
                    !Number.isFinite(z)
                ) {
                    continue;
                }

                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                minZ = Math.min(minZ, z);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
                maxZ = Math.max(maxZ, z);
            }
        }

        if (!Number.isFinite(minX) || !Number.isFinite(maxX)) {
            return {
                center: { x: 0, y: 0, z: 0 },
                size: { x: 0, y: 0, z: 0 },
            };
        }

        return {
            center: {
                x: (minX + maxX) / 2,
                y: (minY + maxY) / 2,
                z: (minZ + maxZ) / 2,
            },
            size: {
                x: maxX - minX,
                y: maxY - minY,
                z: maxZ - minZ,
            },
        };
    },

    dispose() {
        // Browser fallback keeps no native resources yet.
    },
};

type StepWorkerResponse =
    | { ok: true; result: StepInspection }
    | { ok: false; error: string };

export async function resolveSelectedGeometry(
    backend: GeometryBackend,
    inspection: StepInspection,
    entity: StepEntity,
): Promise<GeometryPreview> {
    return backend.loadSelectedNodeGeometry(inspection, entity);
}
