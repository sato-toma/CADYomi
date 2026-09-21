import type { StepEntity, StepInspection } from "./step";

interface StepRecord {
    id: string;
    type: string;
    raw: string;
}

export function createMetadataInspection(
    fileName: string,
    fileSize: number,
    content: ArrayBuffer,
): StepInspection {
    const text = new TextDecoder().decode(content);
    const records = scanRecords(text);
    const products = records.filter((record) => record.type === "PRODUCT");
    const productNames = new Map<string, string>();

    for (const product of products) {
        const name = product.raw.match(/PRODUCT\s*\(\s*'([^']*)'/i)?.[1];
        if (name) {
            productNames.set(product.id, name);
        }
    }

    const entities: StepEntity[] = [];
    const sourceRecords =
        products.length > 0 ? products : records.slice(0, 200);
    const rootId = products.length > 0 ? "step:root" : undefined;

    if (rootId) {
        entities.push({
            id: rootId,
            name: fileName,
            type: "ASSEMBLY_ROOT",
            raw: "Lightweight STEP assembly index",
            meshIndices: [],
            depth: 0,
        });
    }

    for (const [index, record] of sourceRecords.entries()) {
        const name =
            productNames.get(record.id) ??
            record.raw.match(/\(\s*'([^']*)'/)?.[1] ??
            record.type;
        entities.push({
            id: `step:${record.id}`,
            name,
            parentId: rootId,
            depth: rootId ? 1 : index === 0 ? 0 : 1,
            type: record.type,
            raw: record.raw,
            meshIndices: [],
        });
    }

    if (entities.length === 0) {
        entities.push({
            id: "step:root",
            name: fileName,
            type: "STEP_DOCUMENT",
            raw: "No lightweight STEP records were found.",
            meshIndices: [],
        });
    }

    return {
        fileName,
        fileSize,
        header: text.slice(0, 512).split(/\r?\n/),
        entities,
        importer: "step-metadata",
    };
}

function scanRecords(text: string): StepRecord[] {
    const records: StepRecord[] = [];
    const recordPattern = /#(\d+)\s*=\s*([A-Z0-9_]+)\s*\(([^;]*)\);/gi;
    for (const match of text.matchAll(recordPattern)) {
        records.push({
            id: match[1],
            type: match[2].toUpperCase(),
            raw: `#${match[1]}=${match[2]}(${match[3]});`,
        });
    }

    return records;
}
