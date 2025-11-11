import { useMemo } from "react";
import type { Dimension, Node } from "../model/types";
import { useAppState } from "../state/useAppState";

type RawValue = string | number | null;

type Normalizer = (value: RawValue) => number;

interface AxisTick {
  label: string;
  position: number;
}

interface AxisConfig {
  normalize: Normalizer;
  ticks: AxisTick[];
}

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

function buildNumericAxis(nodes: Node[], dimension: Dimension): AxisConfig {
  const values = nodes
    .map((node) => toNumber(node.dimensions[dimension.id] ?? null))
    .filter((value): value is number => value !== null);

  if (values.length === 0) {
    return { normalize: () => 0.5, ticks: [] };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return {
      normalize: () => 0.5,
      ticks: [
        {
          label: String(min),
          position: 0.5,
        },
      ],
    };
  }

  const normalize: Normalizer = (value) => {
    const numeric = toNumber(value);
    if (numeric === null) {
      return 0.5;
    }
    return (numeric - min) / (max - min);
  };

  const mid = (min + max) / 2;
  const ticks: AxisTick[] = [
    { label: String(min), position: 0 },
    { label: String(Number.isInteger(mid) ? mid : Number(mid.toFixed(2))), position: 0.5 },
    { label: String(max), position: 1 },
  ];

  return { normalize, ticks };
}

function toTimestamp(value: RawValue): number | null {
  if (value === null || value === "") {
    return null;
  }
  const date = new Date(String(value));
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
}

function buildDatetimeAxis(nodes: Node[], dimension: Dimension): AxisConfig {
  const values = nodes
    .map((node) => toTimestamp(node.dimensions[dimension.id] ?? null))
    .filter((value): value is number => value !== null);

  if (values.length === 0) {
    return { normalize: () => 0.5, ticks: [] };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    const label = new Date(min).toISOString().slice(0, 10);
    return {
      normalize: () => 0.5,
      ticks: [{ label, position: 0.5 }],
    };
  }

  const normalize: Normalizer = (value) => {
    const timestamp = toTimestamp(value);
    if (timestamp === null) {
      return 0.5;
    }
    return (timestamp - min) / (max - min);
  };

  const mid = new Date((min + max) / 2).toISOString().slice(0, 10);
  const ticks: AxisTick[] = [
    { label: new Date(min).toISOString().slice(0, 10), position: 0 },
    { label: mid, position: 0.5 },
    { label: new Date(max).toISOString().slice(0, 10), position: 1 },
  ];

  return { normalize, ticks };
}

function buildCategoricalAxis(nodes: Node[], dimension: Dimension): AxisConfig {
  const categorySet = new Set<string>();
  nodes.forEach((node) => {
    const raw = node.dimensions[dimension.id];
    const label = raw === null || raw === "" ? "(no value)" : String(raw);
    categorySet.add(label);
  });

  if (categorySet.size === 0) {
    return { normalize: () => 0.5, ticks: [] };
  }

  const categories = Array.from(categorySet).sort((a, b) => a.localeCompare(b));

  if (categories.length === 1) {
    return {
      normalize: () => 0.5,
      ticks: [{ label: categories[0], position: 0.5 }],
    };
  }

  const steps = categories.length - 1;
  const positions = new Map(categories.map((category, index) => [category, index / steps]));

  const normalize: Normalizer = (value) => {
    const label = value === null || value === "" ? "(no value)" : String(value);
    return positions.get(label) ?? 0.5;
  };

  const ticks: AxisTick[] = categories.map((category) => ({
    label: category,
    position: positions.get(category) ?? 0.5,
  }));

  return { normalize, ticks };
}

function buildAxis(nodes: Node[], dimension: Dimension): AxisConfig {
  switch (dimension.kind) {
    case "numeric":
      return buildNumericAxis(nodes, dimension);
    case "datetime":
      return buildDatetimeAxis(nodes, dimension);
    case "categorical":
      return buildCategoricalAxis(nodes, dimension);
    default:
      return { normalize: () => 0.5, ticks: [] };
  }
}

export function View2D() {
  const { filteredNodes, dimensions, selectedDimensions, selectedNodeId, selectNode } =
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

  if (filteredNodes.length === 0) {
    return (
      <div>
        <h2>
          2D View – X: {dimX.name} ({dimX.kind}) Y: {dimY.name} ({dimY.kind})
        </h2>
        <p>No data matches the current filters.</p>
      </div>
    );
  }

  const axis = useMemo(() => {
    const axisX = buildAxis(filteredNodes, dimX);
    const axisY = buildAxis(filteredNodes, dimY);
    return { axisX, axisY };
  }, [filteredNodes, dimX, dimY]);

  const width = 600;
  const height = 400;
  const padding = 40;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const points = filteredNodes.map((node) => {
    const rawX = node.dimensions[dimX.id] ?? null;
    const rawY = node.dimensions[dimY.id] ?? null;
    const tX = axis.axisX.normalize(rawX);
    const tY = axis.axisY.normalize(rawY);
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
        {axis.axisX.ticks.map((tick) => {
          const x = padding + tick.position * innerWidth;
          return (
            <g key={`x-${tick.label}`}>
              <line
                x1={x}
                x2={x}
                y1={height - padding}
                y2={height - padding + 6}
                stroke="#888"
              />
              <text
                x={x}
                y={height - padding + 18}
                textAnchor="middle"
                fontSize={10}
                fill="#333"
              >
                {tick.label}
              </text>
            </g>
          );
        })}
        {axis.axisY.ticks.map((tick) => {
          const y = height - padding - tick.position * innerHeight;
          return (
            <g key={`y-${tick.label}`}>
              <line
                x1={padding - 6}
                x2={padding}
                y1={y}
                y2={y}
                stroke="#888"
              />
              <text
                x={padding - 10}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill="#333"
              >
                {tick.label}
              </text>
            </g>
          );
        })}
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
