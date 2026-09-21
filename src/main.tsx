import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import * as THREE from "three";
import "./styles.css";
import {
    createGeometryBackend,
    type GeometryBackend,
    resolveSelectedGeometry,
} from "./geometry-backend";
import {
    createMappedGeometrySession,
    createMeshGeometrySession,
    type GeometrySession,
} from "./geometry-session";
import type { StepEntity, StepMeshData } from "./step";
import { createMetadataInspection } from "./step-metadata";

function App() {
    const geometryBackendRef = useRef<GeometryBackend | null>(null);
    const geometrySessionRef = useRef<GeometrySession | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const viewerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rootGroupRef = useRef<THREE.Group | null>(null);
    const [geometrySession, setGeometrySession] =
        useState<GeometrySession | null>(null);
    const [selectedEntity, setSelectedEntity] = useState<StepEntity | null>(
        null,
    );
    const [selectedMeshes, setSelectedMeshes] = useState<StepMeshData[]>([]);
    const [selectedGeometryLoading, setSelectedGeometryLoading] =
        useState(false);
    const [renderReady, setRenderReady] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!geometryBackendRef.current) {
        geometryBackendRef.current = createGeometryBackend();
    }

    const geometryBackend = geometryBackendRef.current;
    const inspection = geometrySession?.inspection ?? null;

    useEffect(() => {
        if (!viewerRef.current) {
            return;
        }

        const container = viewerRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0b1220);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(
            45,
            container.clientWidth / container.clientHeight || 1,
            0.1,
            100000,
        );
        camera.position.set(200, 200, 200);
        cameraRef.current = camera;

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
        directionalLight.position.set(120, 180, 220);
        scene.add(directionalLight);

        const grid = new THREE.GridHelper(200, 20, 0x4a627d, 0x223548);
        scene.add(grid);

        const rootGroup = new THREE.Group();
        rootGroupRef.current = rootGroup;
        scene.add(rootGroup);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        const resize = () => {
            if (!container) {
                return;
            }

            const width = container.clientWidth || 1;
            const height = container.clientHeight || 1;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        const handleResize = () => resize();
        window.addEventListener("resize", handleResize);

        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });

        return () => {
            geometrySessionRef.current?.dispose();
            geometryBackend.dispose();
            window.removeEventListener("resize", handleResize);
            renderer.setAnimationLoop(null);
            rootGroup.clear();
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            sceneRef.current = null;
            cameraRef.current = null;
            rootGroupRef.current = null;
        };
    }, [geometryBackend]);

    useEffect(() => {
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const rootGroup = rootGroupRef.current;

        if (!scene || !camera || !rootGroup) {
            return;
        }

        rootGroup.clear();

        if (!geometrySession || !selectedEntity) {
            return;
        }

        const activeRootGroup = rootGroup;
        const activeCamera = camera;
        const nextGroup = new THREE.Group();
        for (const meshData of selectedMeshes) {
            nextGroup.add(buildMeshFromStep(meshData));
        }
        activeRootGroup.add(nextGroup);

        if (selectedMeshes.length === 0) {
            return;
        }

        void geometrySession
            .loadPreviewBoundingBox(selectedEntity)
            .then((bounds) => {
                const center = new THREE.Vector3(
                    bounds.center.x,
                    bounds.center.y,
                    bounds.center.z,
                );
                const size = new THREE.Vector3(
                    bounds.size.x,
                    bounds.size.y,
                    bounds.size.z,
                );
                const distance = Math.max(size.x, size.y, size.z, 1) * 1.8;
                activeCamera.position.set(
                    center.x + distance,
                    center.y + distance * 0.8,
                    center.z + distance * 0.9,
                );
                activeCamera.lookAt(center);
            });
    }, [geometrySession, selectedEntity, selectedMeshes]);

    useEffect(() => {
        if (!geometrySession || !selectedEntity) {
            return;
        }

        let cancelled = false;
        setSelectedGeometryLoading(true);
        setSelectedMeshes([]);

        void resolveSelectedGeometry(geometrySession, selectedEntity)
            .then((meshes) => {
                if (!cancelled) {
                    setSelectedMeshes(meshes);
                }
            })
            .catch((cause) => {
                if (!cancelled) {
                    setError(
                        cause instanceof Error
                            ? cause.message
                            : "Unable to load selected node geometry.",
                    );
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setSelectedGeometryLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [geometrySession, selectedEntity]);

    async function handleFileChange(
        event: React.ChangeEvent<HTMLInputElement>,
    ) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setLoadingStatus("Reading local file...");
        setError(null);
        geometrySessionRef.current?.dispose();
        geometrySessionRef.current = null;
        setGeometrySession(null);
        setSelectedEntity(null);
        setSelectedMeshes([]);
        setRenderReady(false);

        try {
            const content = await file.arrayBuffer();
            const metadata = createMetadataInspection(
                file.name,
                file.size,
                content,
            );
            const metadataSession = createMeshGeometrySession(metadata);
            geometrySessionRef.current = metadataSession;
            setGeometrySession(metadataSession);
            setSelectedEntity(metadata.entities[0] ?? null);
            setLoadingStatus("Assembly metadata ready; loading geometry...");

            const result = await geometryBackend.loadTree({
                fileName: file.name,
                fileSize: file.size,
                content,
            });
            metadataSession.dispose();
            const stableSession = createMappedGeometrySession(metadata, result);
            geometrySessionRef.current = stableSession;
            setGeometrySession(stableSession);
            setSelectedEntity(metadata.entities[0] ?? null);
            setRenderReady(true);
            setLoadingStatus(null);
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Unable to read the selected STEP file.",
            );
            setLoadingStatus(null);
        }

        event.target.value = "";
    }

    return (
        <main className="app-shell">
            <aside className="sidebar">
                <h1>CADYomi</h1>
                <p>Local STEP inspection workspace</p>
                <ul>
                    <li>Structure first</li>
                    <li>Properties before geometry</li>
                    <li>Local browser processing</li>
                </ul>
            </aside>

            <section className="workspace">
                <header className="toolbar">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Open STEP
                    </button>
                    <input
                        ref={fileInputRef}
                        className="file-input"
                        type="file"
                        accept=".step,.stp,model/step"
                        onChange={handleFileChange}
                    />
                    <span className="toolbar-status">
                        {loadingStatus
                            ? loadingStatus
                            : error
                              ? "Import failed"
                              : selectedGeometryLoading
                                ? "Preparing selected render..."
                                : renderReady
                                  ? "Render ready"
                                  : inspection
                                    ? `${inspection.entities.length} entities indexed`
                                    : "No file loaded"}
                    </span>
                </header>

                <div className="inspection-layout">
                    <section className="panel entity-panel">
                        <div className="panel-heading">
                            <div>
                                <p className="eyebrow">Model index</p>
                                <h2>
                                    {inspection?.fileName ??
                                        "No STEP file selected"}
                                </h2>
                            </div>
                            {inspection && (
                                <span className="entity-count">
                                    {inspection.entities.length}
                                </span>
                            )}
                        </div>

                        {error && (
                            <p className="message error-message">{error}</p>
                        )}
                        {!inspection && !error && (
                            <div className="empty-state">
                                <strong>Start with structure</strong>
                                <span>
                                    Select a local STEP file to inspect its
                                    entities and properties.
                                </span>
                            </div>
                        )}
                        {inspection && (
                            <div className="entity-table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th scope="col">Entity</th>
                                            <th scope="col">Entity type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inspection.entities.map((entity) => (
                                            <tr key={entity.id}>
                                                <td>
                                                    <button
                                                        className={`entity-row ${selectedEntity?.id === entity.id ? "selected" : ""}`}
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedEntity(
                                                                entity,
                                                            )
                                                        }
                                                    >
                                                        <span
                                                            className="entity-name"
                                                            style={{
                                                                paddingLeft: `${(entity.depth ?? 0) * 18}px`,
                                                            }}
                                                        >
                                                            <span className="entity-folder-mark">
                                                                {entity.type.includes(
                                                                    "ASSEMBLY",
                                                                )
                                                                    ? ">"
                                                                    : "-"}
                                                            </span>
                                                            {entity.name ??
                                                                entity.type}
                                                        </span>
                                                        <span className="entity-id">
                                                            #{entity.id}
                                                        </span>
                                                    </button>
                                                </td>
                                                <td>{entity.type}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <aside className="panel property-panel">
                        <p className="eyebrow">Property inspector</p>
                        <h2>
                            {selectedEntity
                                ? (selectedEntity.name ?? selectedEntity.type)
                                : "Select an entity"}
                        </h2>
                        {selectedEntity ? (
                            <dl className="property-list">
                                <div>
                                    <dt>Entity ID</dt>
                                    <dd>{selectedEntity.id}</dd>
                                </div>
                                <div>
                                    <dt>Type</dt>
                                    <dd>{selectedEntity.type}</dd>
                                </div>
                                <div>
                                    <dt>Mesh references</dt>
                                    <dd>
                                        {selectedGeometryLoading
                                            ? "Loading..."
                                            : selectedEntity.meshIndices
                                                    .length > 0
                                              ? selectedEntity.meshIndices.join(
                                                    ", ",
                                                )
                                              : "No direct mesh data"}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Raw record</dt>
                                    <dd className="raw-record">
                                        {selectedEntity.raw}
                                    </dd>
                                </div>
                            </dl>
                        ) : (
                            <p className="muted">
                                Entity properties will appear here.
                            </p>
                        )}

                        <div className="viewer-panel">
                            <div ref={viewerRef} className="viewer-canvas" />
                        </div>

                        {inspection && (
                            <div className="file-summary">
                                <span>File size</span>
                                <strong>
                                    {formatBytes(inspection.fileSize)}
                                </strong>
                            </div>
                        )}
                    </aside>
                </div>
            </section>
        </main>
    );
}

function buildMeshFromStep(mesh: StepMeshData): THREE.Mesh {
    const geometry = new THREE.BufferGeometry();
    const positionArray = new Float32Array(mesh.attributes.position.array);
    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positionArray, 3),
    );

    if (mesh.attributes.normal) {
        geometry.setAttribute(
            "normal",
            new THREE.Float32BufferAttribute(
                new Float32Array(mesh.attributes.normal.array),
                3,
            ),
        );
    } else {
        geometry.computeVertexNormals();
    }

    const indexArray = mesh.index?.array ?? [];
    if (indexArray.length > 0) {
        geometry.setIndex(
            new THREE.BufferAttribute(Uint32Array.from(indexArray), 1),
        );
    }

    const color = mesh.color
        ? new THREE.Color(mesh.color[0], mesh.color[1], mesh.color[2])
        : new THREE.Color(0xcccccc);

    const material = new THREE.MeshPhongMaterial({
        color,
        specular: 0,
        side: THREE.DoubleSide,
    });

    const meshObject = new THREE.Mesh(geometry, material);
    meshObject.name = mesh.name ?? "STEP mesh";
    return meshObject;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    return `${(bytes / 1024).toFixed(1)} KB`;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
