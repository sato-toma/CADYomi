import React, { useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import type { StepEntity, StepInspection } from "./step";

type StepWorkerResponse =
    | { ok: true; result: StepInspection }
    | { ok: false; error: string };

function App() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [inspection, setInspection] = useState<StepInspection | null>(null);
    const [selectedEntity, setSelectedEntity] = useState<StepEntity | null>(
        null,
    );
    const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleFileChange(
        event: React.ChangeEvent<HTMLInputElement>,
    ) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setLoadingStatus("Reading local file...");
        setError(null);
        setInspection(null);
        setSelectedEntity(null);

        try {
            const content = await file.arrayBuffer();
            setLoadingStatus("Parsing STEP with OCCT...");

            const worker = new Worker(
                new URL("./step.worker.ts", import.meta.url),
                { type: "module" },
            );

            worker.onmessage = (response: MessageEvent<StepWorkerResponse>) => {
                if (response.data.ok) {
                    setInspection(response.data.result);
                    setSelectedEntity(response.data.result.entities[0] ?? null);
                } else {
                    setError(response.data.error);
                }

                setLoadingStatus(null);
                worker.terminate();
            };

            worker.onerror = () => {
                setError(
                    "The STEP importer worker stopped unexpectedly. Check the browser console for details.",
                );
                setLoadingStatus(null);
                worker.terminate();
            };

            worker.onmessageerror = () => {
                setError("The STEP importer returned an unreadable result.");
                setLoadingStatus(null);
                worker.terminate();
            };

            worker.postMessage(
                {
                    fileName: file.name,
                    fileSize: file.size,
                    content,
                },
                [content],
            );
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
                                            <th scope="col">ID</th>
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
                                                        #{entity.id}
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
                                ? `#${selectedEntity.id}`
                                : "Select an entity"}
                        </h2>
                        {selectedEntity ? (
                            <dl className="property-list">
                                <div>
                                    <dt>Type</dt>
                                    <dd>{selectedEntity.type}</dd>
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
