export interface StepEntity {
    id: string;
    type: string;
    raw: string;
}

export interface StepInspection {
    fileName: string;
    fileSize: number;
    header: string[];
    entities: StepEntity[];
    importer: "occt-import-js";
}

export interface OcctNode {
    name?: string;
    meshes?: number[];
    children?: OcctNode[];
}

export interface OcctImportResult {
    success: boolean;
    root?: OcctNode;
    meshes?: unknown[];
}

function flattenNode(
    node: OcctNode,
    path: string,
    entities: StepEntity[],
): void {
    const name = node.name?.trim() || "Unnamed node";
    const id = path === "0" ? "root" : path;
    const meshCount = node.meshes?.length ?? 0;

    entities.push({
        id,
        type: meshCount > 0 ? "GEOMETRY_NODE" : "ASSEMBLY_NODE",
        raw: JSON.stringify({ name, meshCount }),
    });

    node.children?.forEach((child, index) => {
        flattenNode(child, `${path}.${index}`, entities);
    });
}

export function createInspectionFromOcct(
    fileName: string,
    fileSize: number,
    result: OcctImportResult,
): StepInspection {
    if (!result.success || !result.root) {
        throw new Error("OCCT could not parse the selected STEP file.");
    }

    const entities: StepEntity[] = [];
    flattenNode(result.root, "0", entities);

    if (entities.length === 0) {
        throw new Error("OCCT parsed the file but returned no model nodes.");
    }

    return {
        fileName,
        fileSize,
        header: [],
        entities,
        importer: "occt-import-js",
    };
}
