import { useEffect, useSyncExternalStore } from "react";
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

interface Store {
  state: AppState;
  isLoading: boolean;
  error: string | null;
  attemptedThirdDimension: boolean;
}

let store: Store = {
  state: initialState,
  isLoading: true,
  error: null,
  attemptedThirdDimension: false,
};

type Listener = () => void;

const listeners = new Set<Listener>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

function setStore(updater: (prev: Store) => Store) {
  const next = updater(store);
  const changed =
    next.state !== store.state ||
    next.isLoading !== store.isLoading ||
    next.error !== store.error ||
    next.attemptedThirdDimension !== store.attemptedThirdDimension;

  store = next;

  if (changed) {
    notify();
  }
}

const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => store;

let dataLoadStarted = false;

function ensureDataLoaded() {
  if (dataLoadStarted) {
    return;
  }
  dataLoadStarted = true;

  loadData()
    .then((data) => {
      setStore((prev) => ({
        ...prev,
        state: {
          ...prev.state,
          nodes: data.nodes,
          dimensions: data.dimensions,
          selectedNodeId: prev.state.selectedNodeId ?? data.nodes[0]?.id ?? null,
        },
        isLoading: false,
        error: null,
      }));
    })
    .catch((err: unknown) => {
      setStore((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    });
}

const toggleDimension = (dimensionId: string) => {
  setStore((prev) => {
    const alreadySelected = prev.state.selectedDimensions.includes(dimensionId);

    if (alreadySelected) {
      return {
        ...prev,
        attemptedThirdDimension: false,
        state: {
          ...prev.state,
          selectedDimensions: prev.state.selectedDimensions.filter((id) => id !== dimensionId),
        },
      };
    }

    if (prev.state.selectedDimensions.length >= 2) {
      if (prev.attemptedThirdDimension) {
        return prev;
      }
      return {
        ...prev,
        attemptedThirdDimension: true,
      };
    }

    return {
      ...prev,
      attemptedThirdDimension: false,
      state: {
        ...prev.state,
        selectedDimensions: [...prev.state.selectedDimensions, dimensionId],
      },
    };
  });
};

const selectNode = (nodeId: string | null) => {
  setStore((prev) => ({
    ...prev,
    state: {
      ...prev.state,
      selectedNodeId: nodeId,
    },
  }));
};

export function useAppState(): UseAppStateValue {
  useEffect(() => {
    ensureDataLoaded();
  }, []);

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    ...snapshot.state,
    isLoading: snapshot.isLoading,
    error: snapshot.error,
    attemptedThirdDimension: snapshot.attemptedThirdDimension,
    toggleDimension,
    selectNode,
  };
}
