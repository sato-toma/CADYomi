import type { GeometryTreeSource } from "./geometry-backend";
import type { GeometryBounds } from "./geometry-session";
import type { StepInspection, StepMeshData } from "./step";

export type TessellationQuality = "draft" | "normal" | "precise";

export interface TessellationOptions {
    quality?: TessellationQuality;
    linearDeflection: number;
    angularDeflection: number;
}

export const tessellationPresets: Record<
    TessellationQuality,
    TessellationOptions
> = {
    draft: {
        quality: "draft",
        linearDeflection: 0.01,
        angularDeflection: 0.5,
    },
    normal: {
        quality: "normal",
        linearDeflection: 0.001,
        angularDeflection: 0.5,
    },
    precise: {
        quality: "precise",
        linearDeflection: 0.0001,
        angularDeflection: 0.25,
    },
};

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
