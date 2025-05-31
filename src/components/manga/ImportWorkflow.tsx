import {
    ImportItem,
    useImport,
} from "@/contexts/ImportContext";
import {
    Background,
    Controls,
    Edge,
    Handle,
    Node,
    Position,
    ReactFlow,
    useEdgesState,
    useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
    BookOpen,
    CheckCircle,
    Clock,
    Database,
    File,
    FileSearch,
    FolderTree,
    Loader2,
    Play,
    Scan,
    XCircle,
} from "lucide-react";
import { useCallback, useEffect } from "react";

// Add custom CSS for better edge visibility
const workflowStyles = `
.workflow-container .react-flow__edge-path {
    stroke-width: 2;
}

.workflow-container .react-flow__edge.animated .react-flow__edge-path {
    stroke-width: 3;
}

.workflow-container .react-flow__node {
    z-index: 5;
}

.workflow-container .react-flow__edge {
    z-index: 1;
}

.workflow-container .react-flow__edge.animated {
    z-index: 4;
}
`;

// Define the node data types
type ImportNodeData = ImportItem & {
    isCurrentItem?: boolean;
    label?: string;
    description?: string;
    icon?: React.ReactNode;
    step?: string;
};

type FolderNodeData = ImportNodeData & {
    isExpanded?: boolean;
};

// Define process step node type
type ProcessStepData = {
    id: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    status?: "pending" | "processing" | "success" | "error";
    isActive?: boolean;
};

// Import node component for individual items
function ImportNode({ data }: { data: ImportNodeData }) {
    const getStatusIcon = () => {
        switch (data.status) {
            case "success":
                return (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                );
            case "error":
                return (
                    <XCircle className="h-5 w-5 text-red-500" />
                );
            case "processing":
                return (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                );
            case "pending":
            default:
                return (
                    <Clock className="h-5 w-5 text-gray-500" />
                );
        }
    };

    const getNodeClass = () => {
        switch (data.status) {
            case "success":
                return "border-green-500 bg-green-50 dark:bg-green-900/20";
            case "error":
                return "border-red-500 bg-red-50 dark:bg-red-900/20";
            case "processing":
                return "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg";
            case "pending":
            default:
                return "border-gray-300 bg-white dark:bg-gray-800";
        }
    };

    const icon =
        data.type === "manga" ? (
            <BookOpen className="h-4 w-4 mr-1" />
        ) : (
            <File className="h-4 w-4 mr-1" />
        );

    return (
        <div
            className={`p-4 rounded-lg border-2 shadow ${getNodeClass()} min-w-[200px] relative`}
        >
            {/* Add handles for connections */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 bg-gray-400 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 bg-gray-400 border-2 border-white"
            />

            <div className="flex items-center gap-2 font-medium">
                {getStatusIcon()}
                <span className="flex items-center">
                    {icon} {data.name}
                </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[250px]">
                {data.path}
            </div>
            {data.message && (
                <div
                    className={`text-xs mt-2 ${
                        data.status === "error"
                            ? "text-red-500"
                            : "text-gray-600 dark:text-gray-300"
                    }`}
                >
                    {data.message}
                </div>
            )}
            {data.status === "processing" && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 dark:bg-gray-700">
                    <div
                        className="bg-blue-500 h-1.5 rounded-full animate-pulse"
                        style={{ width: "100%" }}
                    />
                </div>
            )}
        </div>
    );
}

// Process node component for workflow steps
function ProcessNode({ data }: { data: ProcessStepData }) {
    const getStatusIcon = () => {
        switch (data.status) {
            case "success":
                return (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                );
            case "error":
                return (
                    <XCircle className="h-5 w-5 text-red-500" />
                );
            case "processing":
                return (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                );
            case "pending":
            default:
                return (
                    <Clock className="h-5 w-5 text-gray-500" />
                );
        }
    };

    const getNodeClass = () => {
        const activeClass = data.isActive
            ? "ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-gray-900 shadow-lg shadow-blue-200 dark:shadow-blue-900/30"
            : "";

        switch (data.status) {
            case "success":
                return `border-green-500 bg-green-50 dark:bg-green-900/20 ${activeClass}`;
            case "error":
                return `border-red-500 bg-red-50 dark:bg-red-900/20 ${activeClass}`;
            case "processing":
                return `border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg ${activeClass}`;
            case "pending":
            default:
                return `border-gray-300 bg-white dark:bg-gray-800 ${activeClass}`;
        }
    };

    return (
        <div
            className={`p-4 rounded-lg border-2 shadow ${getNodeClass()} min-w-[200px] relative`}
        >
            {/* Add handles for connections */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-gray-400 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-gray-400 border-2 border-white"
            />

            <div className="flex items-center gap-2 font-medium">
                {getStatusIcon()}
                <span className="flex items-center">
                    {data.icon && (
                        <span className="mr-2">
                            {data.icon}
                        </span>
                    )}
                    {data.label}
                </span>
            </div>
            {data.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {data.description}
                </div>
            )}

            {/* Add visual indicator for active step */}
            {data.isActive && (
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                </div>
            )}
        </div>
    );
}

// Folder node component for parent directories
function FolderNode({ data }: { data: FolderNodeData }) {
    const getStatusIcon = () => {
        switch (data.status) {
            case "success":
                return (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                );
            case "error":
                return (
                    <XCircle className="h-5 w-5 text-red-500" />
                );
            case "processing":
                return (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                );
            case "pending":
            default:
                return (
                    <Clock className="h-5 w-5 text-gray-500" />
                );
        }
    };

    const getNodeClass = () => {
        switch (data.status) {
            case "success":
                return "border-green-500 bg-green-50 dark:bg-green-900/20";
            case "error":
                return "border-red-500 bg-red-50 dark:bg-red-900/20";
            case "processing":
                return "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg";
            case "pending":
            default:
                return "border-gray-300 bg-white dark:bg-gray-800";
        }
    };

    const childrenCount = data.children?.length || 0;

    return (
        <div
            className={`p-4 rounded-lg border-2 shadow ${getNodeClass()} min-w-[250px] relative`}
        >
            {/* Add handles for connections */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 bg-gray-400 border-2 border-white"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 bg-gray-400 border-2 border-white"
            />

            <div className="flex items-center gap-2 font-medium">
                {getStatusIcon()}
                <span className="flex items-center">
                    <FolderTree className="h-5 w-5 mr-2" />
                    {data.name}
                </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[250px]">
                {data.path}
            </div>
            {data.message && (
                <div
                    className={`text-xs mt-2 ${
                        data.status === "error"
                            ? "text-red-500"
                            : "text-gray-600 dark:text-gray-300"
                    }`}
                >
                    {data.message}
                </div>
            )}
            {childrenCount > 0 && (
                <div className="text-xs mt-2 bg-secondary/30 px-2 py-1 rounded">
                    {childrenCount}{" "}
                    {data.type === "manga"
                        ? "manga"
                        : "light novels"}
                </div>
            )}
            {data.progress !== undefined &&
                data.progress > 0 && (
                    <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>{data.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                            <div
                                className="bg-blue-500 h-1.5 rounded-full"
                                style={{
                                    width: `${data.progress}%`,
                                }}
                            />
                        </div>
                    </div>
                )}
        </div>
    );
}

// Custom node types
const nodeTypes = {
    importNode: ImportNode,
    folderNode: FolderNode,
    processNode: ProcessNode,
};

export function ImportWorkflow() {
    const { state } = useImport();
    const [nodes, setNodes, onNodesChange] =
        useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] =
        useEdgesState<Edge>([]);

    // Helper to get step icon
    const getStepIcon = (stepId: string) => {
        switch (stepId) {
            case "initialize":
                return <Play className="h-4 w-4" />;
            case "verify_directory":
                return <FolderTree className="h-4 w-4" />;
            case "find_content_directories":
                return <Scan className="h-4 w-4" />;
            case "detect_content":
                return <FileSearch className="h-4 w-4" />;
            case "process_content":
                return <File className="h-4 w-4" />;
            case "save_database":
                return <Database className="h-4 w-4" />;
            case "complete":
                return <CheckCircle className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    // Helper to get edge color based on status
    const getEdgeColor = (
        sourceStatus: string,
        targetStatus: string
    ) => {
        if (sourceStatus === "error") return "#ef4444"; // Red
        if (
            sourceStatus === "success" &&
            targetStatus === "processing"
        )
            return "#3b82f6"; // Blue
        if (
            sourceStatus === "success" &&
            targetStatus === "success"
        )
            return "#10b981"; // Green
        if (sourceStatus === "processing") return "#3b82f6"; // Blue
        return "#64748b"; // Default gray
    };

    // Helper to create validated edges
    const createEdge = (
        id: string,
        source: string,
        target: string,
        nodeIds: string[],
        options: Partial<Edge> = {}
    ): Edge | null => {
        if (
            !nodeIds.includes(source) ||
            !nodeIds.includes(target)
        ) {
            console.warn(
                `Skipping edge ${id}: missing nodes (${source} -> ${target})`
            );
            return null;
        }

        return {
            id,
            source,
            target,
            type: "smoothstep",
            style: { strokeWidth: 2 },
            ...options,
        };
    };

    // Create workflow steps visualization
    const createWorkflowSteps = () => {
        if (
            !state.workflowSteps ||
            state.workflowSteps.length === 0
        ) {
            return { nodes: [], edges: [] };
        }

        const nodes: Node[] = [];
        const edges: Edge[] = [];
        const stepWidth = 280;
        const stepY = 50;

        // Create nodes for each workflow step
        state.workflowSteps.forEach((step, index) => {
            const nodeId = `workflow-${step.id}`;
            nodes.push({
                id: nodeId,
                type: "processNode",
                data: {
                    id: step.id,
                    label: step.name,
                    description: step.message,
                    status: step.status,
                    isActive:
                        state.currentStepId === step.id,
                    icon: getStepIcon(step.id),
                },
                position: {
                    x: index * stepWidth + 50,
                    y: stepY,
                },
            });
        });

        // Create edges between workflow steps
        const nodeIds = nodes.map((n) => n.id);
        state.workflowSteps.forEach((step, index) => {
            if (index < state.workflowSteps.length - 1) {
                const nextStep =
                    state.workflowSteps[index + 1];
                const sourceNodeId = `workflow-${step.id}`;
                const targetNodeId = `workflow-${nextStep.id}`;

                const isActiveTransition =
                    (step.status === "success" &&
                        nextStep.status === "processing") ||
                    step.status === "processing";

                const edge = createEdge(
                    `workflow-edge-${step.id}-${nextStep.id}`,
                    sourceNodeId,
                    targetNodeId,
                    nodeIds,
                    {
                        animated: isActiveTransition,
                        style: {
                            stroke: getEdgeColor(
                                step.status,
                                nextStep.status
                            ),
                            strokeWidth: isActiveTransition
                                ? 3
                                : 2,
                        },
                    }
                );

                if (edge) edges.push(edge);
            }
        });

        return { nodes, edges };
    };

    // Create content items visualization
    const createContentItems = (workflowNodes: Node[]) => {
        if (!state.items || state.items.length === 0) {
            return { nodes: [], edges: [] };
        }

        const nodes: Node[] = [];
        const edges: Edge[] = [];
        const itemsPerRow = 3;
        const itemWidth = 350;
        const itemHeight = 250;
        const startY = 300;

        // Create parent directory nodes
        state.items.forEach((item, index) => {
            const row = Math.floor(index / itemsPerRow);
            const col = index % itemsPerRow;
            const xPos = col * itemWidth + 50;
            const yPos = startY + row * itemHeight;

            const parentNodeId = `parent-${item.id}`;
            nodes.push({
                id: parentNodeId,
                type: "folderNode",
                data: {
                    ...item,
                    isCurrentItem:
                        state.currentItemId === item.id,
                },
                position: { x: xPos, y: yPos },
            });

            // Create child nodes
            if (item.children && item.children.length > 0) {
                const childrenPerRow = 2;
                const childWidth = 250;
                const childHeight = 150;
                const childStartY = yPos + 180;

                item.children.forEach(
                    (child, childIndex) => {
                        const childRow = Math.floor(
                            childIndex / childrenPerRow
                        );
                        const childCol =
                            childIndex % childrenPerRow;
                        const childX =
                            xPos +
                            (childCol - 0.5) * childWidth;
                        const childY =
                            childStartY +
                            childRow * childHeight;

                        const childNodeId = `child-${item.id}-${child.id}`;
                        nodes.push({
                            id: childNodeId,
                            type: "importNode",
                            data: {
                                ...child,
                                isCurrentItem:
                                    state.currentChildId ===
                                    child.id,
                            },
                            position: {
                                x: childX,
                                y: childY,
                            },
                        });
                    }
                );
            }
        });

        // Create edges
        const allNodes = [...workflowNodes, ...nodes];
        const allNodeIds = allNodes.map((n) => n.id);

        state.items.forEach((item) => {
            const parentNodeId = `parent-${item.id}`;

            // Connect to current workflow step if processing
            if (
                item.status === "processing" &&
                state.currentStepId
            ) {
                const workflowNodeId = `workflow-${state.currentStepId}`;
                const edge = createEdge(
                    `workflow-to-item-${state.currentStepId}-${item.id}`,
                    workflowNodeId,
                    parentNodeId,
                    allNodeIds,
                    {
                        animated: true,
                        style: {
                            stroke: "#3b82f6",
                            strokeWidth: 2,
                        },
                    }
                );
                if (edge) edges.push(edge);
            }

            // Create edges for children
            if (item.children && item.children.length > 0) {
                item.children.forEach((child) => {
                    const childNodeId = `child-${item.id}-${child.id}`;

                    // Parent to child edge
                    const parentToChildEdge = createEdge(
                        `edge-parent-${item.id}-child-${child.id}`,
                        parentNodeId,
                        childNodeId,
                        allNodeIds,
                        {
                            animated:
                                state.currentChildId ===
                                child.id,
                            style: {
                                stroke:
                                    state.currentChildId ===
                                    child.id
                                        ? "#3b82f6"
                                        : "#64748b",
                                strokeWidth:
                                    state.currentChildId ===
                                    child.id
                                        ? 2
                                        : 1.5,
                            },
                        }
                    );
                    if (parentToChildEdge)
                        edges.push(parentToChildEdge);

                    // Success child to database step
                    if (child.status === "success") {
                        const dbStepId =
                            "workflow-save_database";
                        const successEdge = createEdge(
                            `success-${childNodeId}-${dbStepId}`,
                            childNodeId,
                            dbStepId,
                            allNodeIds,
                            {
                                style: {
                                    stroke: "#10b981",
                                    strokeWidth: 1.5,
                                    strokeDasharray: "5,5",
                                },
                            }
                        );
                        if (successEdge)
                            edges.push(successEdge);
                    }
                });
            }
        });

        return { nodes, edges };
    };

    // Create nodes and edges
    const createNodesAndEdges = useCallback(() => {
        const {
            nodes: workflowNodes,
            edges: workflowEdges,
        } = createWorkflowSteps();
        const { nodes: contentNodes, edges: contentEdges } =
            createContentItems(workflowNodes);

        return {
            nodes: [...workflowNodes, ...contentNodes],
            edges: [...workflowEdges, ...contentEdges],
        };
    }, [
        state.items,
        state.currentItemId,
        state.currentChildId,
        state.workflowSteps,
        state.currentStepId,
    ]);

    // Update nodes when state changes
    useEffect(() => {
        const timer = setTimeout(() => {
            const { nodes: newNodes, edges: newEdges } =
                createNodesAndEdges();
            setNodes(newNodes);
            setEdges(newEdges);
        }, 50);

        return () => clearTimeout(timer);
    }, [createNodesAndEdges, setNodes, setEdges]);

    // Show placeholder if no data
    if (
        (!state.items || state.items.length === 0) &&
        (!state.workflowSteps ||
            state.workflowSteps.length === 0)
    ) {
        return (
            <div className="flex items-center justify-center h-[400px] border border-dashed rounded-lg bg-gray-50 dark:bg-gray-900/20">
                <p className="text-gray-500 dark:text-gray-400">
                    No items in the import queue. Add
                    directories to get started.
                </p>
            </div>
        );
    }

    return (
        <div className="h-[600px] border rounded-lg bg-gray-50 dark:bg-gray-900/20">
            <style
                dangerouslySetInnerHTML={{
                    __html: workflowStyles,
                }}
            />

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.1}
                maxZoom={2}
                defaultEdgeOptions={{
                    type: "smoothstep",
                    style: { strokeWidth: 2 },
                }}
                fitViewOptions={{
                    padding: 0.1,
                    includeHiddenNodes: true,
                    minZoom: 0.1,
                    maxZoom: 1,
                }}
                className="workflow-container"
            >
                <Background color="#aaa" gap={16} />
                <Controls />
            </ReactFlow>
        </div>
    );
}
