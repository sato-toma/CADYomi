import type { GeometryBackend, GeometryTreeSource } from "./geometry-backend";
import type { StepEntity, StepInspection, StepMeshData } from "./step";

export const nativeGeometryBackend: GeometryBackend = {
    async loadTree({ fileName }: GeometryTreeSource): Promise<StepInspection> {
        throw new Error(
            `Native geometry backend is not available in the browser for ${fileName}.`,
        );
    },

    async loadSelectedNodeGeometry(
        _inspection: StepInspection,
        _entity: StepEntity,
    ): Promise<StepMeshData[]> {
        throw new Error(
            "Native geometry backend is not available in the browser.",
        );
    },

    async loadPreviewBoundingBox() {
        throw new Error(
            "Native geometry backend is not available in the browser.",
        );
    },

    dispose() {
        // Native resource cleanup will be implemented with the native host.
    },
};
