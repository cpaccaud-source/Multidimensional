import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { Node } from "../model/types";
import { useAppState } from "../state/useAppState";

const NO_VALUE_LABEL = "(no value)";

function collectNumericExtent(nodes: Node[], dimensionId: string) {
  let min: number | null = null;
  let max: number | null = null;

  nodes.forEach((node) => {
    const dims = (node?.dimensions ?? {}) as Record<string, unknown>;
    const raw = dims[dimensionId];
    if (typeof raw === "number" && Number.isFinite(raw)) {
      min = min === null ? raw : Math.min(min, raw);
      max = max === null ? raw : Math.max(max, raw);
      return;
    }

    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed === "") {
        return;
      }
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) {
        min = min === null ? parsed : Math.min(min, parsed);
        max = max === null ? parsed : Math.max(max, parsed);
      }
    }
  });

  return { min, max };
}

function collectDatetimeExtent(nodes: Node[], dimensionId: string) {
  let min: number | null = null;
  let max: number | null = null;

  nodes.forEach((node) => {
    const dims = (node?.dimensions ?? {}) as Record<string, unknown>;
    const raw = dims[dimensionId];
    if (raw === null || raw === undefined) {
      return;
    }
    const value = typeof raw === "string" ? raw.trim() : raw;
    if (value === "") {
      return;
    }
    const date = new Date(value as string);
    const time = date.getTime();
    if (Number.isNaN(time)) {
      return;
    }
    min = min === null ? time : Math.min(min, time);
    max = max === null ? time : Math.max(max, time);
  });

  const format = (timestamp: number | null) =>
    timestamp === null ? null : new Date(timestamp).toISOString().slice(0, 10);

  return { min: format(min), max: format(max) };
}

function collectCategoricalOptions(nodes: Node[], dimensionId: string) {
  const options = new Set<string>();

  nodes.forEach((node) => {
    const dims = (node?.dimensions ?? {}) as Record<string, unknown>;
    const raw = dims[dimensionId];
    if (raw === null || raw === undefined) {
      options.add(NO_VALUE_LABEL);
    } else {
      const value = String(raw).trim();
      options.add(value === "" ? NO_VALUE_LABEL : value);
    }
  });

  return Array.from(options).sort((a, b) => a.localeCompare(b));
}

export function DimensionSelector() {
  const {
    dimensions,
    nodes,
    selectedDimensions,
    toggleDimension,
    updateNumericFilter,
    updateDatetimeFilter,
    updateCategoricalFilter,
    clearFilter,
    filters,
  } = useAppState();

  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeDimensions = Array.isArray(dimensions) ? dimensions : [];
  const hasData = safeNodes.length > 0 && safeDimensions.length > 0;

  const numericExtents = useMemo(() => {
    const result = new Map<string, { min: number | null; max: number | null }>();
    if (!safeDimensions.length || !safeNodes.length) {
      return result;
    }
    safeDimensions.forEach((dimension) => {
      if (dimension.kind === "numeric") {
        result.set(dimension.id, collectNumericExtent(safeNodes, dimension.id));
      }
    });
    return result;
  }, [safeDimensions, safeNodes]);

  const datetimeExtents = useMemo(() => {
    const result = new Map<string, { min: string | null; max: string | null }>();
    if (!safeDimensions.length || !safeNodes.length) {
      return result;
    }
    safeDimensions.forEach((dimension) => {
      if (dimension.kind === "datetime") {
        result.set(dimension.id, collectDatetimeExtent(safeNodes, dimension.id));
      }
    });
    return result;
  }, [safeDimensions, safeNodes]);

  const categoricalOptions = useMemo(() => {
    const result = new Map<string, string[]>();
    if (!safeDimensions.length || !safeNodes.length) {
      return result;
    }
    safeDimensions.forEach((dimension) => {
      if (dimension.kind === "categorical") {
        result.set(dimension.id, collectCategoricalOptions(safeNodes, dimension.id));
      }
    });
    return result;
  }, [safeDimensions, safeNodes]);

  const filterContainerStyle: CSSProperties = {
    marginLeft: "1.5rem",
    marginTop: "0.5rem",
    paddingLeft: "0.75rem",
    borderLeft: "2px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  };

  const labelStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    fontSize: "0.9rem",
  };

  const helperTextStyle: CSSProperties = {
    fontSize: "0.8rem",
    color: "#6b7280",
  };

  return (
    <aside className="panel">
      <h2>Dimensions</h2>
      <div>
        {!hasData ? (
          <div>Loading data…</div>
        ) : (
          safeDimensions.map((dimension) => {
            const checked = selectedDimensions.includes(dimension.id);
            const filterMap = filters ?? {};
            const filter = filterMap[dimension.id];
            const numericExtent = dimension.kind === "numeric" ? numericExtents.get(dimension.id) : undefined;
            const datetimeExtent = dimension.kind === "datetime" ? datetimeExtents.get(dimension.id) : undefined;
          const categoricalValues = dimension.kind === "categorical"
            ? categoricalOptions.get(dimension.id) ?? []
            : [];
          const numericFilter = filter?.type === "numeric" ? filter : undefined;
          const datetimeFilter = filter?.type === "datetime" ? filter : undefined;
          const categoricalFilter = filter?.type === "categorical" ? filter : undefined;

          return (
            <div key={dimension.id} className="dimension-item">
              <label>
                <span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleDimension(dimension.id)}
                  />
                  {" "}
                  {dimension.name}
                </span>
                <span className="dimension-kind">({dimension.kind})</span>
              </label>

              {checked && (
                <div style={filterContainerStyle}>
                  {dimension.kind === "numeric" && (
                    <>
                      <div style={helperTextStyle}>
                        {numericExtent && numericExtent.min !== null && numericExtent.max !== null
                          ? `Available range: ${numericExtent.min} – ${numericExtent.max}`
                          : "No numeric values available"}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <label style={labelStyle}>
                          Min
                          <input
                            type="number"
                            min={numericExtent?.min ?? undefined}
                            max={numericExtent?.max ?? undefined}
                            value={numericFilter?.min ?? ""}
                            onChange={(event) => {
                              const nextMin = event.target.value === "" ? null : Number(event.target.value);
                              if (Number.isNaN(nextMin)) {
                                return;
                              }
                              updateNumericFilter(dimension.id, nextMin, numericFilter?.max ?? null);
                            }}
                            step="any"
                          />
                        </label>
                        <label style={labelStyle}>
                          Max
                          <input
                            type="number"
                            min={numericExtent?.min ?? undefined}
                            max={numericExtent?.max ?? undefined}
                            value={numericFilter?.max ?? ""}
                            onChange={(event) => {
                              const nextMax = event.target.value === "" ? null : Number(event.target.value);
                              if (Number.isNaN(nextMax)) {
                                return;
                              }
                              updateNumericFilter(dimension.id, numericFilter?.min ?? null, nextMax);
                            }}
                            step="any"
                          />
                        </label>
                        <button type="button" onClick={() => clearFilter(dimension.id)}>
                          Reset
                        </button>
                      </div>
                    </>
                  )}

                  {dimension.kind === "datetime" && (
                    <>
                      <div style={helperTextStyle}>
                        {datetimeExtent && datetimeExtent.min && datetimeExtent.max
                          ? `Available range: ${datetimeExtent.min} – ${datetimeExtent.max}`
                          : "No date values available"}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <label style={labelStyle}>
                          From
                          <input
                            type="date"
                            value={datetimeFilter?.start ?? ""}
                            min={datetimeExtent?.min ?? undefined}
                            max={datetimeExtent?.max ?? undefined}
                            onChange={(event) => {
                              const nextStart = event.target.value === "" ? null : event.target.value;
                              updateDatetimeFilter(dimension.id, nextStart, datetimeFilter?.end ?? null);
                            }}
                          />
                        </label>
                        <label style={labelStyle}>
                          To
                          <input
                            type="date"
                            value={datetimeFilter?.end ?? ""}
                            min={datetimeExtent?.min ?? undefined}
                            max={datetimeExtent?.max ?? undefined}
                            onChange={(event) => {
                              const nextEnd = event.target.value === "" ? null : event.target.value;
                              updateDatetimeFilter(dimension.id, datetimeFilter?.start ?? null, nextEnd);
                            }}
                          />
                        </label>
                        <button type="button" onClick={() => clearFilter(dimension.id)}>
                          Reset
                        </button>
                      </div>
                    </>
                  )}

                  {dimension.kind === "categorical" && (
                    <>
                      <div style={helperTextStyle}>Select one or more values</div>
                      <select
                        multiple
                        value={categoricalFilter?.values ?? []}
                        onChange={(event) => {
                          const selectedValues = Array.from(event.target.selectedOptions).map(
                            (option) => option.value
                          );
                          updateCategoricalFilter(dimension.id, selectedValues);
                        }}
                        size={Math.min(Math.max(categoricalValues.length, 3), 8)}
                        style={{ width: "100%", minWidth: "12rem" }}
                      >
                        {categoricalValues.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <button type="button" onClick={() => clearFilter(dimension.id)}>
                        Reset
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        )}
      </div>
      <div className="dimensions-info">
        <div>ℹ️ Select up to 2 dimensions at a time.</div>
        <div>Filters apply to the currently selected dimensions.</div>
      </div>
    </aside>
  );
}
