import { useEffect, useMemo, useState } from "react";
import { loadData } from "../data/loadData";
import type { AppState } from "../model/types";

interface UseAppStateValue extends AppState {
  isLoading: boolean;
  error: string | null;
  attemptedThirdDimension: boolean;
  toggleDimension: (dimensionId: string) => void;
  selectNode: (nodeId: string | null) => void;
}

const initialState: AppState = {
  nodes: [],
  dimensions: [],
  selectedDimensions: [],
  selectedNodeId: null,
};

export function useAppState(): UseAppStateValue {
  const [state, setState] = useState<AppState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attemptedThirdDimension, setAttemptedThirdDimension] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadData()
      .then((data) => {
        if (!mounted) {
          return;
        }
        setState((prev) => ({
          ...prev,
          nodes: data.nodes,
          dimensions: data.dimensions,
          selectedNodeId: prev.selectedNodeId ?? data.nodes[0]?.id ?? null,
        }));
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!mounted) {
          return;
        }
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const toggleDimension = (dimensionId: string) => {
    setState((prev) => {
      const alreadySelected = prev.selectedDimensions.includes(dimensionId);
      if (alreadySelected) {
        setAttemptedThirdDimension(false);
        return {
          ...prev,
          selectedDimensions: prev.selectedDimensions.filter((id) => id !== dimensionId),
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
      };
    });
  };

  const selectNode = (nodeId: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedNodeId: nodeId,
    }));
  };

  return useMemo(
    () => ({
      ...state,
      isLoading,
      error,
      attemptedThirdDimension,
      toggleDimension,
      selectNode,
    }),
    [state, isLoading, error, attemptedThirdDimension]
  );
}
