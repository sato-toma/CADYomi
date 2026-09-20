import occtImportJs from "occt-import-js";
import wasmUrl from "occt-import-js/dist/occt-import-js.wasm?url";
import { createInspectionFromOcct, type StepInspection } from "./step";

type StepWorkerResponse =
    | { ok: true; result: StepInspection }
    | { ok: false; error: string };

self.onmessage = (
    event: MessageEvent<{
        fileName: string;
        fileSize: number;
        content: ArrayBuffer;
    }>,
) => {
    void handleMessage(event);
};

async function handleMessage(
    event: MessageEvent<{
        fileName: string;
        fileSize: number;
        content: ArrayBuffer;
    }>,
): Promise<void> {
    try {
        const { fileName, fileSize, content } = event.data;
        const occt = await occtImportJs({ locateFile: () => wasmUrl });
        const result = occt.ReadStepFile(new Uint8Array(content), {
            linearUnit: "millimeter",
            linearDeflectionType: "bounding_box_ratio",
            linearDeflection: 0.001,
            angularDeflection: 0.5,
        });
        const inspection = createInspectionFromOcct(fileName, fileSize, result);
        self.postMessage({
            ok: true,
            result: inspection,
        } satisfies StepWorkerResponse);
    } catch (cause) {
        const error =
            cause instanceof Error
                ? cause.message
                : "Unable to index the selected STEP file.";
        self.postMessage({ ok: false, error } satisfies StepWorkerResponse);
    }
}
