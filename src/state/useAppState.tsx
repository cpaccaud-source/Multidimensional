import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loadData } from "../data/loadData";
import type { AppState, DimensionFilter, DimensionFilters, Node } from "../model/types";

const NO_VALUE_LABEL = "(no value)";

function coerceNumber(value: string | number | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function coerceTimestamp(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const date = new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
}

function matchesFilterValue(value: string | number | null | undefined, filter: DimensionFilter): boolean {
  switch (filter.type) {
    case "numeric": {
      const numericValue = coerceNumber(value);
      if (filter.min !== null && (numericValue === null || numericValue < filter.min)) {
        return false;
      }
      if (filter.max !== null && (numericValue === null || numericValue > filter.max)) {
        return false;
      }
      return true;
    }
    case "datetime": {
      const timestamp = coerceTimestamp(value);
      if (filter.start) {
        const filterStart = coerceTimestamp(filter.start);
        if (filterStart !== null && (timestamp === null || timestamp < filterStart)) {
          return false;
        }
      }
      if (filter.end) {
        const filterEnd = coerceTimestamp(filter.end);
        if (filterEnd !== null && (timestamp === null || timestamp > filterEnd)) {
          return false;
        }
      }
      return true;
    }
    case "categorical": {
      if (filter.values.length === 0) {
        return true;
      }
      const label = value === null || value === undefined || value === "" ? NO_VALUE_LABEL : String(value);
      return filter.values.includes(label);
    }
    default:
      return true;
  }
}

function omitFilter(filters: DimensionFilters, dimensionId: string): DimensionFilters {
  if (!(dimensionId in filters)) {
    return filters;
  }
  const { [dimensionId]: _removed, ...rest } = filters;
  return rest;
}

interface UseAppStateValue extends AppState {
  isLoading: boolean;
  error: string | null;
  attemptedThirdDimension: boolean;
  toggleDimension: (dimensionId: string) => void;
  selectNode: (nodeId: string | null) => void;
  filteredNodes: Node[];
  updateNumericFilter: (dimensionId: string, min: number | null, max: number | null) => void;
  updateDatetimeFilter: (dimensionId: string, start: string | null, end: string | null) => void;
  updateCategoricalFilter: (dimensionId: string, values: string[]) => void;
  clearFilter: (dimensionId: string) => void;
}

const initialState: AppState = {
  nodes: [],
  dimensions: [],
  selectedDimensions: [],
  selectedNodeId: null,
  filters: {},
};

const AppStateContext = createContext<UseAppStateValue | undefined>(undefined);

interface AppStateProviderProps {
  children: ReactNode;
}

export function AppStateProvider({ children }: AppStateProviderProps) {
  const [state, setState] = useState<AppState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptedThirdDimension, setAttemptedThirdDimension] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadData()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setState((prev) => ({
          ...prev,
          nodes: data.nodes,
          dimensions: data.dimensions,
          selectedNodeId: prev.selectedNodeId ?? data.nodes[0]?.id ?? null,
        }));
        setIsLoading(false);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }

        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleDimension = useCallback((dimensionId: string) => {
    setState((prev) => {
      const prevFilters = prev.filters ?? {};
      const alreadySelected = prev.selectedDimensions.includes(dimensionId);

      if (alreadySelected) {
        setAttemptedThirdDimension(false);
        return {
          ...prev,
          selectedDimensions: prev.selectedDimensions.filter((id) => id !== dimensionId),
          filters: omitFilter(prevFilters, dimensionId),
        };
      }

      if (prev.selectedDimensions.length >= 2) {
        setAttemptedThirdDimension(true);
        return prev;
      }

      setAttemptedThirdDimension(false);
      return {
        ...prev,
        selectedDimensions: [...prev.selectedDimensions, dimensionId],
        filters: prevFilters,
      };
    });
  }, []);

  const selectNode = useCallback((nodeId: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedNodeId: nodeId,
    }));
  }, []);

  const updateNumericFilter = useCallback(
    (dimensionId: string, min: number | null, max: number | null) => {
      setState((prev) => {
        const prevFilters = prev.filters ?? {};
        if (min === null && max === null) {
          return {
            ...prev,
            filters: omitFilter(prevFilters, dimensionId),
          };
        }

        const nextFilters: DimensionFilters = { ...prevFilters };
        nextFilters[dimensionId] = { type: "numeric", min, max };
        return {
          ...prev,
          filters: nextFilters,
        };
      });
    },
    []
  );

  const updateDatetimeFilter = useCallback(
    (dimensionId: string, start: string | null, end: string | null) => {
      setState((prev) => {
        const prevFilters = prev.filters ?? {};
        const normalizedStart = start && start.trim() !== "" ? start : null;
        const normalizedEnd = end && end.trim() !== "" ? end : null;

        if (!normalizedStart && !normalizedEnd) {
          return {
            ...prev,
            filters: omitFilter(prevFilters, dimensionId),
          };
        }

        const nextFilters: DimensionFilters = { ...prevFilters };
        nextFilters[dimensionId] = {
          type: "datetime",
          start: normalizedStart,
          end: normalizedEnd,
        };
        return {
          ...prev,
          filters: nextFilters,
        };
      });
    },
    []
  );

  const updateCategoricalFilter = useCallback((dimensionId: string, values: string[]) => {
    setState((prev) => {
      const prevFilters = prev.filters ?? {};
      if (values.length === 0) {
        return {
          ...prev,
          filters: omitFilter(prevFilters, dimensionId),
        };
      }

      const nextFilters: DimensionFilters = { ...prevFilters };
      nextFilters[dimensionId] = { type: "categorical", values };
      return {
        ...prev,
        filters: nextFilters,
      };
    });
  }, []);

  const clearFilter = useCallback((dimensionId: string) => {
    setState((prev) => ({
      ...prev,
      filters: omitFilter(prev.filters ?? {}, dimensionId),
    }));
  }, []);

  const filteredNodes = useMemo(() => {
    const safeFilters = state.filters ?? {};

    const activeFilters = state.selectedDimensions
      .map((dimensionId) => {
        const filter = safeFilters[dimensionId];
        return filter ? ([dimensionId, filter] as const) : null;
      })
      .filter((entry): entry is readonly [string, DimensionFilter] => entry !== null);

    if (activeFilters.length === 0) {
      return state.nodes;
    }

    return state.nodes.filter((node) =>
      activeFilters.every(([dimensionId, filter]) =>
        matchesFilterValue(node.dimensions[dimensionId], filter)
      )
    );
  }, [state.nodes, state.filters, state.selectedDimensions]);

  useEffect(() => {
    if (filteredNodes.length === 0) {
      setState((prev) => {
        if (prev.selectedNodeId === null) {
          return prev;
        }
        return {
          ...prev,
          selectedNodeId: null,
        };
      });
      return;
    }

    if (!filteredNodes.some((node) => node.id === state.selectedNodeId)) {
      setState((prev) => ({
        ...prev,
        selectedNodeId: filteredNodes[0]?.id ?? null,
      }));
    }
  }, [filteredNodes, state.selectedNodeId]);

  const safeFilters = state.filters ?? {};

  const value = useMemo<UseAppStateValue>(
    () => ({
      ...state,
      filters: safeFilters,
      isLoading,
      error,
      attemptedThirdDimension,
      toggleDimension,
      selectNode,
      filteredNodes,
      updateNumericFilter,
      updateDatetimeFilter,
      updateCategoricalFilter,
      clearFilter,
    }),
    [
      state,
      safeFilters,
      isLoading,
      error,
      attemptedThirdDimension,
      toggleDimension,
      selectNode,
      filteredNodes,
      updateNumericFilter,
      updateDatetimeFilter,
      updateCategoricalFilter,
      clearFilter,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): UseAppStateValue {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }

  return context;
}
