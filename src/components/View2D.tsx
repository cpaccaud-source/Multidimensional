import type { Dimension } from "../model/types";

interface View2DProps {
  xDimension: Dimension | undefined;
  yDimension: Dimension | undefined;
}

export function View2D({ xDimension, yDimension }: View2DProps) {
  return (
    <>
      <h2>2D View</h2>
      <div className="placeholder">
        <div>
          X: {xDimension ? `${xDimension.name} (${xDimension.kind})` : "None"}
        </div>
        <div>
          Y: {yDimension ? `${yDimension.name} (${yDimension.kind})` : "None"}
        </div>
        <p>Scatter plot / matrix placeholder.</p>
      </div>
    </>
  );
}
