import {
    type OcctOpenedDocument,
    type OcctWasmBridge,
    type TessellationQuality,
    tessellationPresets,
} from "./occt-wasm-bridge";
import type { StepEntity, StepInspection, StepMeshData } from "./step";

export interface GeometryBounds {
    center: { x: number; y: number; z: number };
    size: { x: number; y: number; z: number };
}

export interface GeometrySession {
    readonly inspection: StepInspection;
    loadSelectedNodeGeometry(
        entity: StepEntity,
        quality?: TessellationQuality,
    ): Promise<StepMeshData[]>;
    loadPreviewBoundingBox(entity: StepEntity): Promise<GeometryBounds>;
    dispose(): void;
}

export function createMeshGeometrySession(
    inspection: StepInspection,
): GeometrySession {
    return {
        inspection,

        async loadSelectedNodeGeometry(entity) {
            return entity.meshIndices
                .map((meshIndex) => inspection.meshes?.[meshIndex])
                .filter((mesh): mesh is StepMeshData => Boolean(mesh));
        },

        async loadPreviewBoundingBox(entity) {
            const meshes = await this.loadSelectedNodeGeometry(entity);

            if (meshes.length === 0) {
                return emptyBounds();
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
                return emptyBounds();
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
            // Mesh-backed sessions do not own native resources.
        },
    };
}

export function createOcctGeometrySession(
    opened: OcctOpenedDocument,
    bridge: OcctWasmBridge,
): GeometrySession {
    let released = false;

    return {
        inspection: opened.inspection,

        loadSelectedNodeGeometry(entity, quality = "draft") {
            return bridge.tessellateEntity(opened.documentHandle, entity.id, {
                ...tessellationPresets[quality],
            });
        },

        loadPreviewBoundingBox(entity) {
            return bridge.getEntityBounds(opened.documentHandle, entity.id);
        },

        dispose() {
            if (!released) {
                released = true;
                void bridge.releaseDocument(opened.documentHandle);
            }
        },
    };
}

export function createMappedGeometrySession(
    displayInspection: StepInspection,
    geometrySession: GeometrySession,
): GeometrySession {
    const geometryByName = new Map<string, StepEntity>();

    for (const entity of geometrySession.inspection.entities) {
        const name = entity.name?.trim().toLowerCase();
        if (name && !geometryByName.has(name)) {
            geometryByName.set(name, entity);
        }
    }

    function resolveGeometryEntity(entity: StepEntity): StepEntity | null {
        const name = entity.name?.trim().toLowerCase();
        return name ? (geometryByName.get(name) ?? null) : null;
    }

    return {
        inspection: displayInspection,

        loadSelectedNodeGeometry(entity, quality) {
            const geometryEntity = resolveGeometryEntity(entity);
            return geometryEntity
                ? geometrySession.loadSelectedNodeGeometry(
                      geometryEntity,
                      quality,
                  )
                : Promise.resolve([]);
        },

        loadPreviewBoundingBox(entity) {
            const geometryEntity = resolveGeometryEntity(entity);
            return geometryEntity
                ? geometrySession.loadPreviewBoundingBox(geometryEntity)
                : Promise.resolve(emptyBounds());
        },

        dispose() {
            geometrySession.dispose();
        },
    };
}

function emptyBounds(): GeometryBounds {
    return {
        center: { x: 0, y: 0, z: 0 },
        size: { x: 0, y: 0, z: 0 },
    };
}
