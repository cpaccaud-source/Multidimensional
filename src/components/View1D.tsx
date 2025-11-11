import { useAppState } from "../state/useAppState";

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "(no value)";
  }

  return String(value);
}

function parseDate(value: string | number | null | undefined) {
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }
  return null;
}

function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function View1D() {
  const { nodes, dimensions, selectedDimensions, selectedNodeId, selectNode } = useAppState();

  if (selectedDimensions.length !== 1) {
    return <div className="placeholder">Select exactly one dimension to use the 1D view.</div>;
  }

  const dimensionId = selectedDimensions[0];
  const dimension = dimensions.find((item) => item.id === dimensionId);

  if (!dimension) {
    return <div className="placeholder">Selected dimension could not be found.</div>;
  }

  if (nodes.length === 0) {
    return <div className="placeholder">No data to display for this dimension.</div>;
  }

  const listStyle: React.CSSProperties = { listStyle: "none", padding: 0, margin: 0 };
  const itemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  };

  let content: JSX.Element | JSX.Element[];

  if (dimension.kind === "datetime") {
    const sortedNodes = [...nodes].sort((a, b) => {
      const aValue = parseDate(a.dimensions[dimension.id]);
      const bValue = parseDate(b.dimensions[dimension.id]);

      if (aValue && bValue) {
        return aValue.getTime() - bValue.getTime();
      }
      if (aValue) return -1;
      if (bValue) return 1;
      return a.label.localeCompare(b.label);
    });

    content = (
      <ul style={listStyle}>
        {sortedNodes.map((node) => {
          const rawValue = node.dimensions[dimension.id];
          const isSelected = node.id === selectedNodeId;
          return (
            <li
              key={node.id}
              style={{
                ...itemStyle,
                backgroundColor: isSelected ? "#e5f1ff" : undefined,
              }}
              onClick={() => selectNode(node.id)}
            >
              <span style={{ minWidth: "8rem", fontVariantNumeric: "tabular-nums" }}>
                {formatValue(rawValue)}
              </span>
              <span style={{ color: "#6b7280" }}>•</span>
              <span style={{ flex: 1 }}>{node.label}</span>
            </li>
          );
        })}
      </ul>
    );
  } else if (dimension.kind === "numeric") {
    const sortedNodes = [...nodes].sort((a, b) => {
      const aValue = parseNumber(a.dimensions[dimension.id]);
      const bValue = parseNumber(b.dimensions[dimension.id]);

      if (aValue !== null && bValue !== null) {
        return aValue - bValue;
      }
      if (aValue !== null) return -1;
      if (bValue !== null) return 1;
      return a.label.localeCompare(b.label);
    });

    content = (
      <ul style={listStyle}>
        {sortedNodes.map((node) => {
          const rawValue = node.dimensions[dimension.id];
          const numericValue = parseNumber(rawValue);
          const displayValue = numericValue !== null ? numericValue : formatValue(rawValue);
          const isSelected = node.id === selectedNodeId;
          return (
            <li
              key={node.id}
              style={{
                ...itemStyle,
                backgroundColor: isSelected ? "#e5f1ff" : undefined,
              }}
              onClick={() => selectNode(node.id)}
            >
              <span style={{ minWidth: "6rem", fontVariantNumeric: "tabular-nums" }}>
                {displayValue}
              </span>
              <span style={{ color: "#6b7280" }}>•</span>
              <span style={{ flex: 1 }}>{node.label}</span>
            </li>
          );
        })}
      </ul>
    );
  } else {
    const groups = new Map<string, typeof nodes>();

    nodes.forEach((node) => {
      const rawValue = node.dimensions[dimension.id];
      const groupKey = formatValue(rawValue);
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(node);
    });

    const sortedGroups = Array.from(groups.entries()).sort(([aKey], [bKey]) => {
      return aKey.localeCompare(bKey, undefined, { sensitivity: "base" });
    });

    content = sortedGroups.map(([groupKey, groupNodes]) => {
      const sortedGroupNodes = [...groupNodes].sort((a, b) => a.label.localeCompare(b.label));
      return (
        <div key={groupKey} style={{ marginBottom: "1rem" }}>
          <h4 style={{ margin: "0 0 0.5rem" }}>
            {dimension.name}: {groupKey}
          </h4>
          <ul style={listStyle}>
            {sortedGroupNodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              return (
                <li
                  key={node.id}
                  style={{
                    ...itemStyle,
                    marginLeft: "1rem",
                    backgroundColor: isSelected ? "#e5f1ff" : undefined,
                  }}
                  onClick={() => selectNode(node.id)}
                >
                  <span style={{ color: "#6b7280" }}>•</span>
                  <span style={{ flex: 1 }}>{node.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      );
    });
  }

  return (
    <section>
      <h2>
        1D View – Dimension: {dimension.name} ({dimension.kind})
      </h2>
      {content}
    </section>
  );
}
