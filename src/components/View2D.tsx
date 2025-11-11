import { useMemo } from "react";
import type { Dimension, Node } from "../model/types";
import { useAppState } from "../state/useAppState";

type RawValue = string | number | null;

type Normalizer = (value: RawValue) => number;

function toNumber(value: RawValue): number | null {
  if (value === null || value === "") {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildNumericNormalizer(nodes: Node[], dimension: Dimension): Normalizer {
  const values = nodes
    .map((node) => toNumber(node.dimensions[dimension.id] ?? null))
    .filter((value): value is number => value !== null);

  if (values.length === 0) {
    return () => 0.5;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return () => 0.5;
  }

  return (value: RawValue) => {
    const numeric = toNumber(value);
    if (numeric === null) {
      return 0.5;
    }
    return (numeric - min) / (max - min);
  };
}

function toTimestamp(value: RawValue): number | null {
  if (value === null || value === "") {
    return null;
  }
  const date = new Date(String(value));
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
}

function buildDatetimeNormalizer(nodes: Node[], dimension: Dimension): Normalizer {
  const values = nodes
    .map((node) => toTimestamp(node.dimensions[dimension.id] ?? null))
    .filter((value): value is number => value !== null);

  if (values.length === 0) {
    return () => 0.5;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return () => 0.5;
  }

  return (value: RawValue) => {
    const timestamp = toTimestamp(value);
    if (timestamp === null) {
      return 0.5;
    }
    return (timestamp - min) / (max - min);
  };
}

function buildCategoricalNormalizer(nodes: Node[], dimension: Dimension): Normalizer {
  const categorySet = new Set<string>();
  nodes.forEach((node) => {
    const raw = node.dimensions[dimension.id];
    const label = raw === null || raw === "" ? "(no value)" : String(raw);
    categorySet.add(label);
  });

  if (categorySet.size === 0) {
    return () => 0.5;
  }

  const categories = Array.from(categorySet).sort((a, b) => a.localeCompare(b));

  if (categories.length === 1) {
    return () => 0.5;
  }

  const steps = categories.length - 1;
  const positions = new Map(categories.map((category, index) => [category, index / steps]));

  return (value: RawValue) => {
    const label = value === null || value === "" ? "(no value)" : String(value);
    return positions.get(label) ?? 0.5;
  };
}

function buildNormalizer(nodes: Node[], dimension: Dimension): Normalizer {
  switch (dimension.kind) {
    case "numeric":
      return buildNumericNormalizer(nodes, dimension);
    case "datetime":
      return buildDatetimeNormalizer(nodes, dimension);
    case "categorical":
      return buildCategoricalNormalizer(nodes, dimension);
    default:
      return () => 0.5;
  }
}

export function View2D() {
  const { nodes, dimensions, selectedDimensions, selectedNodeId, selectNode } =
    useAppState();

  if (selectedDimensions.length !== 2) {
    return <p>2D view requires exactly two selected dimensions.</p>;
  }

  const [dimXId, dimYId] = selectedDimensions;
  const dimX = dimensions.find((dimension) => dimension.id === dimXId);
  const dimY = dimensions.find((dimension) => dimension.id === dimYId);

  if (!dimX || !dimY) {
    return <p>Selected dimensions could not be found.</p>;
  }

  if (nodes.length === 0) {
    return <p>No data available for 2D view.</p>;
  }

  const normalizers = useMemo(() => {
    const normalizeX = buildNormalizer(nodes, dimX);
    const normalizeY = buildNormalizer(nodes, dimY);
    return { normalizeX, normalizeY };
  }, [nodes, dimX, dimY]);

  const width = 600;
  const height = 400;
  const padding = 40;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const points = nodes.map((node) => {
    const rawX = node.dimensions[dimX.id] ?? null;
    const rawY = node.dimensions[dimY.id] ?? null;
    const tX = normalizers.normalizeX(rawX);
    const tY = normalizers.normalizeY(rawY);
    const x = padding + tX * innerWidth;
    const y = height - padding - tY * innerHeight;
    return { node, x, y };
  });

  return (
    <div className="view-2d">
      <h2>
        2D View – X: {dimX.name} ({dimX.kind}) Y: {dimY.name} ({dimY.kind})
      </h2>
      <svg width={width} height={height} role="img" aria-label="2D scatter plot">
        <rect
          x={padding}
          y={padding}
          width={innerWidth}
          height={innerHeight}
          fill="none"
          stroke="#ccc"
        />
        <text x={width / 2} y={height - 5} textAnchor="middle" fontSize={12} fill="#555">
          {dimX.name}
        </text>
        <text
          x={10}
          y={height / 2}
          textAnchor="middle"
          fontSize={12}
          fill="#555"
          transform={`rotate(-90 10 ${height / 2})`}
        >
          {dimY.name}
        </text>
        {points.map(({ node, x, y }) => {
          const isSelected = node.id === selectedNodeId;
          return (
            <circle
              key={node.id}
              cx={x}
              cy={y}
              r={isSelected ? 7 : 5}
              fill={isSelected ? "#1976d2" : "#69c"}
              stroke={isSelected ? "#0d47a1" : "#336"}
              strokeWidth={isSelected ? 2 : 1}
              onClick={() => selectNode(node.id)}
              style={{ cursor: "pointer" }}
            >
              <title>{node.label}</title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
}
