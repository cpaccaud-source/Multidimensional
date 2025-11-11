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
  }, []);

  const selectNode = useCallback((nodeId: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedNodeId: nodeId,
    }));
  }, []);

  const value = useMemo<UseAppStateValue>(
    () => ({
      ...state,
      isLoading,
      error,
      attemptedThirdDimension,
      toggleDimension,
      selectNode,
    }),
    [state, isLoading, error, attemptedThirdDimension, toggleDimension, selectNode]
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
