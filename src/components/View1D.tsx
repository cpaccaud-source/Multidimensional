import type { Dimension } from "../model/types";

interface View1DProps {
  dimension: Dimension | undefined;
}

export function View1D({ dimension }: View1DProps) {
  return (
    <>
      <h2>1D View</h2>
      <div className="placeholder">
        <div>
          Dimension: {dimension ? `${dimension.name} (${dimension.kind})` : "None"}
        </div>
        <p>Visualization coming in the next iteration.</p>
      </div>
    </>
  );
}
