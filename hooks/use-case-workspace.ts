"use client";

import { useCallback, useLayoutEffect, useMemo, useReducer, useRef } from "react";
import {
  caseWorkspaceReducer,
  createCaseWorkspaceAdapter,
  createInitialCaseWorkspaceState,
  selectCaseWorkspaceSnapshot,
  type CaseWorkspaceAction,
} from "../domain/case-workspace";

export function useCaseWorkspace(caseId: string) {
  const [state, dispatch] = useReducer(
    caseWorkspaceReducer,
    caseId,
    createInitialCaseWorkspaceState,
  );
  const stateRef = useRef(state);

  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  const applyAction = useCallback((action: CaseWorkspaceAction) => {
    const nextState = caseWorkspaceReducer(stateRef.current, action);
    stateRef.current = nextState;
    dispatch(action);
    return nextState;
  }, []);

  const getState = useCallback(() => stateRef.current, []);

  const adapter = useMemo(() => {
    // The factory stores these callbacks without invoking them during render;
    // reads happen only when a human event or WebMCP tool calls the adapter.
    // eslint-disable-next-line react-hooks/refs
    return createCaseWorkspaceAdapter({
        getState,
        applyAction,
    });
  }, [applyAction, getState]);

  const snapshot = useMemo(() => selectCaseWorkspaceSnapshot(state), [state]);

  return { adapter, snapshot };
}
