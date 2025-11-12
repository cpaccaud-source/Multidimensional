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

export interface NumericFilterState {
  type: "numeric";
  min: number | null;
  max: number | null;
}

export interface DatetimeFilterState {
  type: "datetime";
  start: string | null;
  end: string | null;
}

export interface CategoricalFilterState {
  type: "categorical";
  values: string[];
}

export type DimensionFilter =
  | NumericFilterState
  | DatetimeFilterState
  | CategoricalFilterState;

export type DimensionFilters = Partial<Record<string, DimensionFilter>>;

export interface AppState {
  nodes: Node[];
  dimensions: Dimension[];
  selectedDimensions: string[];
  selectedNodeId: string | null;
  filters: DimensionFilters;
}
