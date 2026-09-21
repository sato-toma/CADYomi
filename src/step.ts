export interface StepMeshData {
    name?: string;
    color?: [number, number, number];
    attributes: {
        position: { array: number[] };
        normal?: { array: number[] };
    };
    index: { array: number[] };
    brep_faces?: Array<{
        first: number;
        last: number;
        color?: [number, number, number] | null;
    }>;
}

export interface StepEntity {
    id: string;
    name?: string;
    type: string;
    raw: string;
    meshIndices: number[];
}

export interface StepInspection {
    fileName: string;
    fileSize: number;
    header: string[];
    entities: StepEntity[];
    meshes?: StepMeshData[];
    importer: "occt-import-js" | "occt-xde-wasm" | "step-metadata";
}

export interface OcctNode {
    name?: string;
    meshes?: number[];
    children?: OcctNode[];
}

export interface OcctImportResult {
    success: boolean;
    root?: OcctNode;
    meshes?: StepMeshData[];
}

function flattenNode(
    node: OcctNode,
    path: string,
    entities: StepEntity[],
): void {
    const name = node.name?.trim() || "Unnamed node";
    const id = path;
    const meshIndices = Array.isArray(node.meshes) ? [...node.meshes] : [];
    const meshCount = meshIndices.length;

    entities.push({
        id,
        type: meshCount > 0 ? "GEOMETRY_NODE" : "ASSEMBLY_NODE",
        raw: JSON.stringify({ name, meshCount, meshIndices }),
        meshIndices,
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
        meshes: Array.isArray(result.meshes) ? [...result.meshes] : [],
        importer: "occt-import-js",
    };
}
