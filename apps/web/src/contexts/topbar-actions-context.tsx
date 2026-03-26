import type { DependencyList, ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type SetActions = (node: ReactNode) => void;

// biome-ignore lint/suspicious/noEmptyBlockStatements: default noop
const SetterContext = createContext<SetActions>(() => {});
const ValueContext = createContext<ReactNode>(null);

export function TopbarActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActionsState] = useState<ReactNode>(null);

  // Stable setter — never changes reference, so SetterContext consumers never re-render
  const setActions = useCallback((node: ReactNode) => {
    setActionsState(node);
  }, []);

  return (
    <SetterContext.Provider value={setActions}>
      <ValueContext.Provider value={actions}>{children}</ValueContext.Provider>
    </SetterContext.Provider>
  );
}

/**
 * Pages call this to register their topbar action buttons.
 * Pass `deps` to control when the actions ReactNode is rebuilt (e.g., when `role` changes).
 * Actions are cleared automatically when the page unmounts.
 */
export function useSetTopbarActions(
  actions: ReactNode,
  deps: DependencyList
): void {
  const setActions = useContext(SetterContext);

  useEffect(() => {
    setActions(actions);
    return () => setActions(null);
    // biome-ignore lint/correctness/useExhaustiveDependencies: caller-controlled deps
  }, deps);
}

/** Topbar reads current page actions from here. */
export function useTopbarActionsSlot(): ReactNode {
  return useContext(ValueContext);
}
