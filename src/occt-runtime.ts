import { initOpenCascade, type OpenCascadeRuntime } from "opencascade.js";

let runtimePromise: Promise<OpenCascadeRuntime> | null = null;

export function loadOcctRuntime(): Promise<OpenCascadeRuntime> {
    if (!runtimePromise) {
        runtimePromise = initOpenCascade();
    }

    return runtimePromise;
}

export function resetOcctRuntime(): void {
    runtimePromise = null;
}
