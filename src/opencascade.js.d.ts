declare module "opencascade.js" {
    export interface OpenCascadeRuntime {
        [name: string]: unknown;
    }

    export function initOpenCascade(): Promise<OpenCascadeRuntime>;
}
