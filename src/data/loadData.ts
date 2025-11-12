import type { Dimension, Node } from "../model/types";

export interface LoadedData {
  nodes: Node[];
  dimensions: Dimension[];
}

export async function loadData(): Promise<LoadedData> {
  const response = await fetch("/data.json");
  if (!response.ok) {
    throw new Error(`Failed to load data: ${response.status}`);
  }

  const raw = (await response.json()) as LoadedData;
  return {
    nodes: (raw.nodes ?? []).map((node) => ({
      ...node,
      dimensions:
        node && typeof node.dimensions === "object" && node.dimensions !== null
          ? node.dimensions
          : {},
    })),
    dimensions: raw.dimensions ?? [],
  };
}
