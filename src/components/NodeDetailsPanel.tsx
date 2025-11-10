import type { Dimension, Node } from "../model/types";

interface NodeDetailsPanelProps {
  node: Node | undefined;
  dimensions: Dimension[];
}

export function NodeDetailsPanel({ node, dimensions }: NodeDetailsPanelProps) {
  return (
    <aside className="panel">
      <h2>Node details</h2>
      {node ? (
        <div>
          <div>
            <strong>Label:</strong> {node.label}
          </div>
          <div>
            <strong>ID:</strong> {node.id}
          </div>
          <div style={{ marginTop: "1rem" }}>
            <strong>Dimensions:</strong>
            <ul>
              {dimensions.map((dimension) => (
                <li key={dimension.id}>
                  {dimension.name}: {String(node.dimensions[dimension.id] ?? "–")}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="placeholder">No node selected</div>
      )}
    </aside>
  );
}
