import {
    createContext,
    ReactNode,
    useContext,
    useReducer,
} from "react";

// Define types for import items
export type ImportItem = {
    id: string;
    name: string;
    path: string;
    status: "pending" | "processing" | "success" | "error";
    message?: string;
    progress?: number;
    type: "manga" | "lightnovel";
    children?: ImportItem[]; // Subdirectories being processed
};

// Define workflow step type
export type WorkflowStep = {
    id: string;
    name: string;
    status: "pending" | "processing" | "success" | "error";
    message?: string;
};

// Define the state type
type ImportState = {
    items: ImportItem[];
    currentItemId: string | null;
    currentChildId: string | null;
    isImporting: boolean;
    overallProgress: number;
    scanMode: "directory";
    workflowSteps: WorkflowStep[];
    currentStepId: string | null;
};

// Define the action types
type ImportAction =
    | {
          type: "ADD_ITEMS";
          payload: { items: ImportItem[] };
      }
    | {
          type: "SET_CURRENT_ITEM";
          payload: { id: string | null };
      }
    | {
          type: "SET_CURRENT_CHILD";
          payload: { id: string | null };
      }
    | {
          type: "UPDATE_ITEM_STATUS";
          payload: {
              id: string;
              status: ImportItem["status"];
              message?: string;
          };
      }
    | {
          type: "UPDATE_ITEM_PROGRESS";
          payload: { id: string; progress: number };
      }
    | {
          type: "ADD_CHILD_ITEMS";
          payload: {
              parentId: string;
              children: ImportItem[];
          };
      }
    | {
          type: "UPDATE_CHILD_STATUS";
          payload: {
              parentId: string;
              childId: string;
              status: ImportItem["status"];
              message?: string;
          };
      }
    | {
          type: "SET_IMPORTING";
          payload: { isImporting: boolean };
      }
    | {
          type: "SET_SCAN_MODE";
          payload: { mode: "directory" };
      }
    | {
          type: "INITIALIZE_WORKFLOW";
          payload: { steps: WorkflowStep[] };
      }
    | {
          type: "UPDATE_WORKFLOW_STEP";
          payload: {
              stepId: string;
              status: WorkflowStep["status"];
              message?: string;
          };
      }
    | {
          type: "SET_CURRENT_STEP";
          payload: { stepId: string | null };
      }
    | { type: "RESET" };

// Initial state
const initialState: ImportState = {
    items: [],
    currentItemId: null,
    currentChildId: null,
    isImporting: false,
    overallProgress: 0,
    scanMode: "directory",
    workflowSteps: [],
    currentStepId: null,
};

// Create the reducer
function importReducer(
    state: ImportState,
    action: ImportAction
): ImportState {
    switch (action.type) {
        case "ADD_ITEMS":
            return {
                ...state,
                items: [
                    ...state.items,
                    ...action.payload.items,
                ],
            };
        case "SET_CURRENT_ITEM":
            return {
                ...state,
                currentItemId: action.payload.id,
            };
        case "SET_CURRENT_CHILD":
            return {
                ...state,
                currentChildId: action.payload.id,
            };
        case "UPDATE_ITEM_STATUS": {
            const updatedItems = state.items.map((item) =>
                item.id === action.payload.id
                    ? {
                          ...item,
                          status: action.payload.status,
                          message:
                              action.payload.message ||
                              item.message,
                      }
                    : item
            );

            // Calculate overall progress
            const completedItems = updatedItems.filter(
                (item) =>
                    item.status === "success" ||
                    item.status === "error"
            ).length;

            const overallProgress =
                updatedItems.length > 0
                    ? Math.round(
                          (completedItems /
                              updatedItems.length) *
                              100
                      )
                    : 0;

            return {
                ...state,
                items: updatedItems,
                overallProgress,
            };
        }
        case "UPDATE_ITEM_PROGRESS": {
            const updatedItems = state.items.map((item) =>
                item.id === action.payload.id
                    ? {
                          ...item,
                          progress: action.payload.progress,
                      }
                    : item
            );

            return {
                ...state,
                items: updatedItems,
            };
        }
        case "ADD_CHILD_ITEMS": {
            const updatedItems = state.items.map((item) =>
                item.id === action.payload.parentId
                    ? {
                          ...item,
                          children: [
                              ...(item.children || []),
                              ...action.payload.children,
                          ],
                      }
                    : item
            );

            return {
                ...state,
                items: updatedItems,
            };
        }
        case "UPDATE_CHILD_STATUS": {
            const updatedItems = state.items.map((item) => {
                if (
                    item.id === action.payload.parentId &&
                    item.children
                ) {
                    const updatedChildren =
                        item.children.map((child) =>
                            child.id ===
                            action.payload.childId
                                ? {
                                      ...child,
                                      status: action.payload
                                          .status,
                                      message:
                                          action.payload
                                              .message ||
                                          child.message,
                                  }
                                : child
                        );

                    // Calculate parent progress based on children
                    const completedChildren =
                        updatedChildren.filter(
                            (child) =>
                                child.status ===
                                    "success" ||
                                child.status === "error"
                        ).length;

                    const progress =
                        updatedChildren.length > 0
                            ? Math.round(
                                  (completedChildren /
                                      updatedChildren.length) *
                                      100
                              )
                            : 0;

                    return {
                        ...item,
                        children: updatedChildren,
                        progress,
                    };
                }
                return item;
            });

            return {
                ...state,
                items: updatedItems,
            };
        }
        case "SET_IMPORTING":
            return {
                ...state,
                isImporting: action.payload.isImporting,
            };
        case "SET_SCAN_MODE":
            return {
                ...state,
                scanMode: action.payload.mode,
            };
        case "INITIALIZE_WORKFLOW":
            return {
                ...state,
                workflowSteps: action.payload.steps,
                currentStepId:
                    action.payload.steps.length > 0
                        ? action.payload.steps[0].id
                        : null,
            };
        case "UPDATE_WORKFLOW_STEP": {
            const updatedSteps = state.workflowSteps.map(
                (step) =>
                    step.id === action.payload.stepId
                        ? {
                              ...step,
                              status: action.payload.status,
                              message:
                                  action.payload.message ||
                                  step.message,
                          }
                        : step
            );
            return {
                ...state,
                workflowSteps: updatedSteps,
            };
        }
        case "SET_CURRENT_STEP":
            return {
                ...state,
                currentStepId: action.payload.stepId,
            };
        case "RESET":
            return initialState;
        default:
            return state;
    }
}

// Create the context
type ImportContextType = {
    state: ImportState;
    addItems: (items: ImportItem[]) => void;
    setCurrentItem: (id: string | null) => void;
    setCurrentChild: (id: string | null) => void;
    updateItemStatus: (
        id: string,
        status: ImportItem["status"],
        message?: string
    ) => void;
    updateItemProgress: (
        id: string,
        progress: number
    ) => void;
    addChildItems: (
        parentId: string,
        children: ImportItem[]
    ) => void;
    updateChildStatus: (
        parentId: string,
        childId: string,
        status: ImportItem["status"],
        message?: string
    ) => void;
    setScanMode: (mode: "directory") => void;
    setImporting: (isImporting: boolean) => void;
    initializeWorkflow: (steps: WorkflowStep[]) => void;
    updateWorkflowStep: (
        stepId: string,
        status: WorkflowStep["status"],
        message?: string
    ) => void;
    setCurrentStep: (stepId: string | null) => void;
    reset: () => void;
};

const ImportContext = createContext<
    ImportContextType | undefined
>(undefined);

// Create the provider component
export function ImportProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [state, dispatch] = useReducer(
        importReducer,
        initialState
    );

    const addItems = (items: ImportItem[]) => {
        dispatch({ type: "ADD_ITEMS", payload: { items } });
    };

    const setCurrentItem = (id: string | null) => {
        dispatch({
            type: "SET_CURRENT_ITEM",
            payload: { id },
        });
    };

    const setCurrentChild = (id: string | null) => {
        dispatch({
            type: "SET_CURRENT_CHILD",
            payload: { id },
        });
    };

    const updateItemStatus = (
        id: string,
        status: ImportItem["status"],
        message?: string
    ) => {
        dispatch({
            type: "UPDATE_ITEM_STATUS",
            payload: { id, status, message },
        });
    };

    const updateItemProgress = (
        id: string,
        progress: number
    ) => {
        dispatch({
            type: "UPDATE_ITEM_PROGRESS",
            payload: { id, progress },
        });
    };

    const addChildItems = (
        parentId: string,
        children: ImportItem[]
    ) => {
        dispatch({
            type: "ADD_CHILD_ITEMS",
            payload: { parentId, children },
        });
    };

    const updateChildStatus = (
        parentId: string,
        childId: string,
        status: ImportItem["status"],
        message?: string
    ) => {
        dispatch({
            type: "UPDATE_CHILD_STATUS",
            payload: { parentId, childId, status, message },
        });
    };

    const setScanMode = (mode: "directory") => {
        dispatch({
            type: "SET_SCAN_MODE",
            payload: { mode },
        });
    };

    const setImporting = (isImporting: boolean) => {
        dispatch({
            type: "SET_IMPORTING",
            payload: { isImporting },
        });
    };

    const initializeWorkflow = (steps: WorkflowStep[]) => {
        dispatch({
            type: "INITIALIZE_WORKFLOW",
            payload: { steps },
        });
    };

    const updateWorkflowStep = (
        stepId: string,
        status: WorkflowStep["status"],
        message?: string
    ) => {
        dispatch({
            type: "UPDATE_WORKFLOW_STEP",
            payload: { stepId, status, message },
        });
    };

    const setCurrentStep = (stepId: string | null) => {
        dispatch({
            type: "SET_CURRENT_STEP",
            payload: { stepId },
        });
    };

    const reset = () => {
        dispatch({ type: "RESET" });
    };

    return (
        <ImportContext.Provider
            value={{
                state,
                addItems,
                setCurrentItem,
                setCurrentChild,
                updateItemStatus,
                updateItemProgress,
                addChildItems,
                updateChildStatus,
                setScanMode,
                setImporting,
                initializeWorkflow,
                updateWorkflowStep,
                setCurrentStep,
                reset,
            }}
        >
            {children}
        </ImportContext.Provider>
    );
}

// Create a hook to use the context
export function useImport() {
    const context = useContext(ImportContext);
    if (context === undefined) {
        throw new Error(
            "useImport must be used within an ImportProvider"
        );
    }
    return context;
}
