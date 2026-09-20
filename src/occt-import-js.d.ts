declare module "occt-import-js" {
    import type { OcctImportResult } from "./step";

    interface OcctModule {
        ReadStepFile(
            content: Uint8Array,
            params: Record<string, string | number> | null,
        ): OcctImportResult;
    }

    type OcctFactory = (options?: {
        locateFile?: (fileName: string) => string;
    }) => Promise<OcctModule>;

    const factory: OcctFactory;
    export default factory;
}

declare module "*.wasm?url" {
    const url: string;
    export default url;
}
