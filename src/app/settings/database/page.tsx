"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SettingsNav } from "@/components/ui/SettingsNav";
import {
  Loader2,
  RefreshCw,
  Database,
  HardDrive,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DatabaseSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [dbInfo, setDbInfo] = useState({
    size: "24.6 MB",
    location: "data/manga-management.db",
    lastBackup: "Never",
    tables: 8,
    totalItems: 256,
  });

  const handleBackupDatabase = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Database backup created successfully");
      setDbInfo({
        ...dbInfo,
        lastBackup: new Date().toLocaleString(),
      });
    }, 1500);
  };

  const handleOptimizeDatabase = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Database optimized successfully");
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <PageHeader
        title="Database Settings"
        subtitle="Manage and maintain your manga database"
        className="mb-4"
      />

      <SettingsNav />

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Database Info Card */}
            <Card className="md:col-span-2 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5 text-orange-500" />
                  Database Information
                </CardTitle>
                <CardDescription>
                  Details about your current database configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Database Size
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {dbInfo.size}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Database Location
                      </div>
                      <div className="mt-1 text-lg font-semibold overflow-hidden text-ellipsis">
                        {dbInfo.location}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Last Backup
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {dbInfo.lastBackup}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Tables
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {dbInfo.tables}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database Actions Card */}
            <Card className="md:col-span-1 lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HardDrive className="mr-2 h-5 w-5 text-orange-500" />
                  Database Actions
                </CardTitle>
                <CardDescription>
                  Maintenance operations for your database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleBackupDatabase}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Backup Database
                  </Button>

                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={handleOptimizeDatabase}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="mr-2 h-4 w-4" />
                    )}
                    Optimize Database
                  </Button>

                  <Button
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={isLoading}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Reset Database
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Database Statistics Card */}
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle>Database Statistics</CardTitle>
                <CardDescription>
                  Overview of items stored in your database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Total Manga
                    </div>
                    <div className="mt-1 text-2xl font-bold">
                      {Math.floor(dbInfo.totalItems / 2)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Total Volumes
                    </div>
                    <div className="mt-1 text-2xl font-bold">
                      {dbInfo.totalItems}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Tags
                    </div>
                    <div className="mt-1 text-2xl font-bold">24</div>
                  </div>
                  <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Collections
                    </div>
                    <div className="mt-1 text-2xl font-bold">12</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Database Tools</CardTitle>
              <CardDescription>
                SQL workbench and database schema viewer
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
