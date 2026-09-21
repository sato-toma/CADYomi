import type { GeometryTreeSource } from "./geometry-backend";
import type { GeometryBounds } from "./geometry-session";
import type { StepInspection, StepMeshData } from "./step";

export interface TessellationOptions {
    linearDeflection: number;
    angularDeflection: number;
}

export interface OcctOpenedDocument {
    documentHandle: string;
    inspection: StepInspection;
}

export interface OcctWasmBridge {
    openStep(source: GeometryTreeSource): Promise<OcctOpenedDocument>;
    getEntityBounds(
        documentHandle: string,
        entityId: string,
    ): Promise<GeometryBounds>;
    tessellateEntity(
        documentHandle: string,
        entityId: string,
        options: TessellationOptions,
    ): Promise<StepMeshData[]>;
    releaseDocument(documentHandle: string): Promise<void> | void;
}
