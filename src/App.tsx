import { DimensionSelector } from "./components/DimensionSelector";
import { NodeDetailsPanel } from "./components/NodeDetailsPanel";
import { View1D } from "./components/View1D";
import { View2D } from "./components/View2D";
import { useAppState } from "./state/useAppState";
import "./App.css";

export function App() {
  const {
    nodes,
    dimensions,
    selectedDimensions,
    selectedNodeId,
    isLoading,
    error,
    attemptedThirdDimension,
  } = useAppState();

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  let panelBody: JSX.Element;

  if (isLoading) {
    panelBody = <div className="placeholder">Loading data…</div>;
  } else if (error) {
    panelBody = <div className="error">{error}</div>;
  } else if (selectedDimensions.length === 0) {
    panelBody = (
      <div className="placeholder">
        <h2>🎯 Multidimensional Explorer</h2>
        <p>Select 1 or 2 dimensions to explore the data.</p>
        <ul style={{ textAlign: "left", display: "inline-block", marginTop: "1rem" }}>
          <li>1 dimension → 1D list / timeline</li>
          <li>2 dimensions → 2D scatter / matrix</li>
        </ul>
      </div>
    );
  } else if (selectedDimensions.length === 1) {
    panelBody = <View1D />;
  } else if (selectedDimensions.length === 2) {
    panelBody = <View2D />;
  } else {
    panelBody = <div className="placeholder">Select up to two dimensions to visualize.</div>;
  }

  return (
    <div className="app-shell">
      <DimensionSelector />
      <section className="panel">
        {attemptedThirdDimension && (
          <div className="notice">3D view not implemented in v0 – will be added later.</div>
        )}
        {panelBody}
      </section>
      <NodeDetailsPanel node={selectedNode} dimensions={dimensions} />
    </div>
  );
}
