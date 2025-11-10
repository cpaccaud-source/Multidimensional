import type { Dimension } from "../model/types";

interface DimensionSelectorProps {
  dimensions: Dimension[];
  selectedDimensions: string[];
  onToggleDimension: (dimensionId: string) => void;
}

export function DimensionSelector({
  dimensions,
  selectedDimensions,
  onToggleDimension,
}: DimensionSelectorProps) {
  return (
    <aside className="panel">
      <h2>Dimensions</h2>
      <div>
        {dimensions.map((dimension) => {
          const checked = selectedDimensions.includes(dimension.id);
          return (
            <div key={dimension.id} className="dimension-item">
              <label>
                <span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleDimension(dimension.id)}
                  />
                  {" "}
                  {dimension.name}
                </span>
                <span className="dimension-kind">({dimension.kind})</span>
              </label>
            </div>
          );
        })}
      </div>
      <div className="dimensions-info">
        <div>ℹ️ Max 2 dimensions</div>
        <div>3D view: v0 placeholder</div>
      </div>
    </aside>
  );
}
