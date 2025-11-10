export type DimensionKind = "numeric" | "datetime" | "categorical";

export interface Dimension {
  id: string;
  name: string;
  kind: DimensionKind;
}

export interface NodeDimensionValues {
  [dimensionId: string]: string | number | null;
}

export interface Node {
  id: string;
  label: string;
  dimensions: NodeDimensionValues;
}

export interface AppState {
  nodes: Node[];
  dimensions: Dimension[];
  selectedDimensions: string[];
  selectedNodeId: string | null;
}
