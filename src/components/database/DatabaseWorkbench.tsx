"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "react-hot-toast";
import {
  Loader2,
  RefreshCw,
  AlertTriangle,
  Database as DatabaseIcon,
  Play,
  Table,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAllSettings,
  resetSettingsToDefaults,
  runReadOnlyQuery,
  getDatabaseSchema,
  updateSettingsRow,
} from "@/lib/actions/settings-actions";

// Function to format cell content with truncation for long values
const formatCellContent = (value: unknown, isExpanded = false) => {
  if (value === null) {
    return <span className="text-gray-400 italic">null</span>;
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  const stringValue =
    typeof value === "object" ? JSON.stringify(value) : String(value);

  // Check if it's likely an image or other binary data (base64 or very long string)
  if (
    stringValue.length > 100 &&
    (stringValue.startsWith("data:image") ||
      stringValue.includes(";base64,") ||
      stringValue.length > 500)
  ) {
    return isExpanded ? (
      <div className="max-w-xs">
        <div className="text-xs opacity-80 mb-1 flex items-center justify-between">
          <span>
            Long content ({stringValue.length.toLocaleString()} chars)
          </span>
          {stringValue.startsWith("data:image") && (
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-0.5 rounded">
              Image data
            </span>
          )}
        </div>
        {stringValue.startsWith("data:image") && (
          <div className="mb-2">
            <img
              src={stringValue}
              alt="Image preview"
              className="max-h-32 max-w-full object-contain border rounded"
            />
          </div>
        )}
        <div className="break-all text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded border overflow-y-auto max-h-32">
          {stringValue}
        </div>
      </div>
    ) : (
      <div className="flex items-center">
        {stringValue.startsWith("data:image") ? (
          <div className="flex items-center">
            <div className="h-5 w-5 mr-1 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
              <img
                src={stringValue}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-xs opacity-80">
              Image data ({(stringValue.length / 1024).toFixed(1)} KB)
            </span>
          </div>
        ) : (
          <span className="text-xs opacity-80">
            {stringValue.substring(0, 30)}...(
            {stringValue.length.toLocaleString()} chars)
          </span>
        )}
      </div>
    );
  }

  return stringValue;
};

export function DatabaseWorkbench() {
  const [dbData, setDbData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [resetting, setResetting] = useState(false);

  // Workbench state
  const [sqlQuery, setSqlQuery] = useState<string>(
    "SELECT * FROM settings LIMIT 10"
  );
  const [queryResults, setQueryResults] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);

  // Schema browser state
  const [schemaData, setSchemaData] = useState<
    Record<string, { columns: string[] }>
  >({});
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<Array<Record<string, unknown>>>(
    []
  );
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: string;
    value: unknown;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // State for tracking expanded cells
  const [expandedCells, setExpandedCells] = useState<Record<string, boolean>>(
    {}
  );

  // Function to toggle expanded state of a cell
  const toggleCellExpansion = (cellId: string) => {
    setExpandedCells((prev) => ({
      ...prev,
      [cellId]: !prev[cellId],
    }));
  };

  // Generate a unique ID for each cell
  const getCellId = (tableId: string, rowIndex: number, columnName: string) => {
    return `${tableId}-${rowIndex}-${columnName}`;
  };

  // Load database info on component mount
  const loadDatabaseInfo = async () => {
    try {
      setLoading(true);
      const data = await getAllSettings();
      setDbData(data);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
      toast.error("Failed to load database information");
    } finally {
      setLoading(false);
    }
  };

  // Load database schema
  const loadDatabaseSchema = async () => {
    try {
      setSchemaLoading(true);
      const { tables, error: schemaError } = await getDatabaseSchema();

      if (schemaError) {
        toast.error(`Error loading schema: ${schemaError}`);
      } else {
        setSchemaData(tables);

        // Auto-select settings table
        if (tables.settings && !selectedTable) {
          setSelectedTable("settings");
          loadTableData("settings");
        }
      }
    } catch (error) {
      console.error("Failed to load database schema:", error);
      toast.error("Failed to load database schema");
    } finally {
      setSchemaLoading(false);
    }
  };

  // Load table data
  const loadTableData = async (tableName: string) => {
    try {
      setQueryLoading(true);
      const { results, error } = await runReadOnlyQuery(
        `SELECT * FROM ${tableName} LIMIT 100`
      );

      if (error) {
        toast.error(`Error loading table data: ${error}`);
      } else {
        // Cast the results to the expected type
        setTableData(results as Record<string, unknown>[]);
      }
    } catch (error) {
      console.error("Failed to load table data:", error);
      toast.error("Failed to load table data");
    } finally {
      setQueryLoading(false);
    }
  };

  // Execute SQL query
  const executeQuery = async () => {
    try {
      setQueryLoading(true);
      setQueryError(null);

      const { results, error } = await runReadOnlyQuery(sqlQuery);

      if (error) {
        setQueryError(error);
        toast.error(`Query error: ${error}`);
      } else {
        // Cast the results to the expected type
        setQueryResults(results as Record<string, unknown>[]);
        toast.success("Query executed successfully");
      }
    } catch (error) {
      console.error("Failed to execute query:", error);
      setQueryError(error instanceof Error ? error.message : String(error));
      toast.error("Failed to execute query");
    } finally {
      setQueryLoading(false);
    }
  };

  // Update cell value (only for settings table)
  const updateCell = async () => {
    if (!editingCell) return;

    try {
      const { id, field, value } = editingCell;

      // Parse value based on current type
      let parsedValue: string | number | boolean = editValue;

      if (typeof value === "number") {
        parsedValue = Number(editValue);
      } else if (typeof value === "boolean" || value === 0 || value === 1) {
        parsedValue = editValue === "1" || editValue === "true";
      }

      const { success, error } = await updateSettingsRow(
        id,
        field,
        parsedValue
      );

      if (error) {
        toast.error(`Update error: ${error}`);
      } else if (success) {
        toast.success(`Updated ${field} successfully`);
        // Reload the table data to show the update
        loadTableData("settings");
        setEditingCell(null);
      }
    } catch (error) {
      console.error("Failed to update value:", error);
      toast.error("Failed to update value");
    }
  };

  // Handle resetting settings to defaults
  const handleResetSettings = async () => {
    if (
      confirm(
        "Are you sure you want to reset all settings to defaults? This cannot be undone."
      )
    ) {
      try {
        setResetting(true);
        const success = await resetSettingsToDefaults();
        if (success) {
          toast.success("Settings have been reset to defaults");
          // Reload database info to show the changes
          await loadDatabaseInfo();

          // Also reload table data if we're viewing settings
          if (selectedTable === "settings") {
            loadTableData("settings");
          }
        } else {
          toast.error("Failed to reset settings");
        }
      } catch (error) {
        setError(error instanceof Error ? error : new Error(String(error)));
        toast.error("Error resetting settings");
      } finally {
        setResetting(false);
      }
    }
  };

  useEffect(() => {
    loadDatabaseInfo();
    loadDatabaseSchema();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-400 mb-4" />
          <p className="text-lg">Loading database information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <strong className="font-bold">Error:</strong>
            <span className="ml-2">{error.message}</span>
          </div>
        </div>
      )}

      <Tabs defaultValue="schema">
        <TabsList className="mb-4">
          <TabsTrigger value="info">
            <DatabaseIcon className="h-4 w-4 mr-2" />
            Database Info
          </TabsTrigger>
          <TabsTrigger value="schema">
            <Table className="h-4 w-4 mr-2" />
            Schema Browser
          </TabsTrigger>
          <TabsTrigger value="sql">
            <Play className="h-4 w-4 mr-2" />
            SQL Query
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          {/* Database Info Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Database Information</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadDatabaseInfo}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
              <CardDescription>
                General information about the database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(dbData, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>

          {/* Settings Management Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Settings Management</CardTitle>
              <CardDescription>
                Reset settings or perform database maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                        Warning
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Resetting settings will restore all preferences to their
                        default values. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="destructive"
                onClick={handleResetSettings}
                disabled={resetting}
                className="bg-red-600 hover:bg-red-700"
              >
                {resetting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset All Settings"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="schema">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Schema Browser</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadDatabaseSchema}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
              <CardDescription>
                Browse database tables and view data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {schemaLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1 border rounded-md p-2 h-[500px] overflow-auto">
                    <h3 className="font-medium text-sm mb-2">Tables</h3>
                    <ul className="space-y-1">
                      {Object.keys(schemaData).map((tableName) => (
                        <li key={tableName}>
                          <button
                            onClick={() => {
                              setSelectedTable(tableName);
                              loadTableData(tableName);
                            }}
                            className={`w-full text-left px-2 py-1 rounded text-sm ${
                              selectedTable === tableName
                                ? "bg-orange-500 text-white"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            {tableName}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="md:col-span-3 border rounded-md p-2 h-[500px] overflow-auto">
                    {selectedTable ? (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">{selectedTable}</h3>
                          <div className="text-xs text-gray-500">
                            {tableData.length} rows •{" "}
                            {schemaData[selectedTable]?.columns.length} columns
                          </div>
                        </div>

                        {queryLoading ? (
                          <div className="flex justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
                          </div>
                        ) : tableData.length > 0 ? (
                          <div className="overflow-x-auto max-w-full scrollbar-thin max-h-[500px]">
                            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm table-fixed">
                              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                                <tr>
                                  {schemaData[selectedTable]?.columns.map(
                                    (column) => (
                                      <th
                                        key={column}
                                        scope="col"
                                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap max-w-[300px]"
                                      >
                                        {column}
                                      </th>
                                    )
                                  )}
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                {tableData.map((row, rowIndex) => (
                                  <tr
                                    key={rowIndex}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                  >
                                    {schemaData[selectedTable]?.columns.map(
                                      (column) => {
                                        const cellId = getCellId(
                                          selectedTable,
                                          rowIndex,
                                          column
                                        );
                                        const isExpanded =
                                          expandedCells[cellId] || false;

                                        return (
                                          <td
                                            key={column}
                                            className="px-3 py-2 max-w-[300px] truncate"
                                          >
                                            {selectedTable === "settings" &&
                                            column !== "id" &&
                                            column !== "updatedAt" ? (
                                              editingCell?.id === row.id &&
                                              editingCell?.field === column ? (
                                                <div className="flex gap-1">
                                                  <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) =>
                                                      setEditValue(
                                                        e.target.value
                                                      )
                                                    }
                                                    className="w-full px-1 py-0.5 text-xs border rounded"
                                                  />
                                                  <Button
                                                    size="sm"
                                                    onClick={updateCell}
                                                    className="p-1 h-6 bg-green-500 hover:bg-green-600 text-white text-xs"
                                                  >
                                                    ✓
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    onClick={() =>
                                                      setEditingCell(null)
                                                    }
                                                    className="p-1 h-6 bg-gray-500 hover:bg-gray-600 text-white text-xs"
                                                  >
                                                    ✕
                                                  </Button>
                                                </div>
                                              ) : (
                                                <button
                                                  className="text-xs text-left w-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded overflow-hidden text-ellipsis"
                                                  onClick={() => {
                                                    setEditingCell({
                                                      id: String(row.id),
                                                      field: column,
                                                      value: row[column],
                                                    });
                                                    setEditValue(
                                                      row[column] !== null &&
                                                        row[column] !==
                                                          undefined
                                                        ? String(row[column])
                                                        : ""
                                                    );
                                                  }}
                                                >
                                                  {formatCellContent(
                                                    row[column]
                                                  )}
                                                </button>
                                              )
                                            ) : (
                                              <div
                                                onClick={() =>
                                                  toggleCellExpansion(cellId)
                                                }
                                                className="cursor-pointer"
                                              >
                                                {formatCellContent(
                                                  row[column],
                                                  isExpanded
                                                )}
                                              </div>
                                            )}
                                          </td>
                                        );
                                      }
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No data found in this table
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        Select a table to view its data
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sql">
          <Card>
            <CardHeader>
              <CardTitle>SQL Query</CardTitle>
              <CardDescription>
                Run read-only SQL queries against the database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        For security reasons, only <strong>SELECT</strong>{" "}
                        statements are allowed.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <textarea
                    rows={4}
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    className="w-full p-3 border rounded-md font-mono text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                    placeholder="SELECT * FROM settings LIMIT 10"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={executeQuery}
                    disabled={queryLoading}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
                  >
                    {queryLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Execute Query
                  </Button>
                </div>

                {queryError && (
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-800 dark:text-red-200 text-sm">
                    <strong>Error:</strong> {queryError}
                  </div>
                )}

                <div className="border rounded-md overflow-hidden">
                  {queryResults.length > 0 ? (
                    <div className="overflow-x-auto scrollbar-thin max-h-[600px]">
                      <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                          <tr>
                            {Object.keys(queryResults[0]).map((column) => (
                              <th
                                key={column}
                                scope="col"
                                className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap max-w-[300px]"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                          {queryResults.map((row, rowIndex) => (
                            <tr
                              key={rowIndex}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              {Object.entries(row).map(([column, value]) => {
                                const cellId = getCellId(
                                  "query",
                                  rowIndex,
                                  column
                                );
                                const isExpanded =
                                  expandedCells[cellId] || false;

                                return (
                                  <td
                                    key={column}
                                    className="px-3 py-2 text-sm max-w-[300px] truncate"
                                  >
                                    <div
                                      onClick={() =>
                                        toggleCellExpansion(cellId)
                                      }
                                      className="cursor-pointer"
                                    >
                                      {formatCellContent(value, isExpanded)}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : queryLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {queryError
                        ? "Error executing query"
                        : "No results to display. Run a query to see results."}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
