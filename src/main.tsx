import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

function App() {
    return (
        <main className="app-shell">
            <aside className="sidebar">
                <h1>CADLens</h1>
                <p>STEP inspection workspace</p>
                <ul>
                    <li>Model tree</li>
                    <li>Property inspector</li>
                    <li>Plugin boundary</li>
                </ul>
            </aside>

            <section className="workspace">
                <header className="toolbar">
                    <button type="button">Open STEP</button>
                    <button type="button">Fit</button>
                    <button type="button">Inspect</button>
                </header>

                <div className="viewport-panel">
                    <div className="placeholder-viewport">
                        <span>Viewport placeholder</span>
                    </div>
                </div>
            </section>
        </main>
    );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
