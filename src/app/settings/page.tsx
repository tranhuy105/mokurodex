"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "react-hot-toast";
import { SettingsNav } from "@/components/ui/SettingsNav";

// Import the default configuration as a reference
import defaultConfig from "@/config/settings";

export default function SettingsPage() {
  const { isLoading, error, updateSettings, ...settings } = useSettings();
  const [isUpdating, setIsUpdating] = useState(false);

  // Handle boolean toggle
  const handleToggle = (key: string, value: boolean) => {
    setIsUpdating(true);
    updateSettings({ [key]: value })
      .then(() => {
        setIsUpdating(false);
        toast.success(`${key} updated successfully`);
      })
      .catch((error) => {
        setIsUpdating(false);
        toast.error(`Failed to update ${key}`);
        console.error(error);
      });
  };

  // Handle mode selection
  const handleModeChange = (
    mode: "singlePage" | "doublePage" | "longStrip"
  ) => {
    setIsUpdating(true);
    updateSettings({ readingMode: mode })
      .then(() => {
        setIsUpdating(false);
        toast.success(`Reading mode updated to ${mode}`);
      })
      .catch((error) => {
        setIsUpdating(false);
        toast.error("Failed to update reading mode");
        console.error(error);
      });
  };

  // Display a loading state while settings are being fetched
  if (isLoading) {
    return (
      <div className="container mx-auto flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-orange-400 mb-4" />
          <p className="text-xl">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Display an error state if settings couldn't be loaded
  if (error) {
    return (
      <div className="container mx-auto p-8">
        <PageHeader
          title="Application Settings"
          subtitle="Customize MokuReader to your preferences"
          className="mb-4"
        />
        <SettingsNav />
        <div className="rounded-lg bg-red-100 p-6 dark:bg-red-900/30">
          <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
            Error Loading Settings
          </h2>
          <p className="text-red-600 dark:text-red-300">{error.message}</p>
          <button
            className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <PageHeader
        title="Application Settings"
        subtitle="Customize MokuReader to your preferences"
        className="mb-4"
      />

      <SettingsNav />

      <Tabs defaultValue="reader" className="w-full">
        <TabsList className="mb-8 overflow-x-auto flex w-full justify-start">
          <TabsTrigger value="reader">Reader</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="anki">Anki Integration</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        {/* Reader Settings Tab */}
        <TabsContent value="reader">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Reading Mode</CardTitle>
                <CardDescription>
                  Control how pages are displayed during reading
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <button
                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                      settings.readingMode === "singlePage"
                        ? "bg-orange-600 text-white"
                        : "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                    }`}
                    onClick={() => handleModeChange("singlePage")}
                  >
                    Single Page
                  </button>
                  <button
                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                      settings.readingMode === "doublePage"
                        ? "bg-orange-600 text-white"
                        : "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                    }`}
                    onClick={() => handleModeChange("doublePage")}
                  >
                    Double Page
                  </button>
                  <button
                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                      settings.readingMode === "longStrip"
                        ? "bg-orange-600 text-white"
                        : "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                    }`}
                    onClick={() => handleModeChange("longStrip")}
                  >
                    Long Strip
                  </button>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <label className="flex items-center justify-between py-2 cursor-pointer">
                    <span className="text-sm font-medium">
                      Right to Left (Japanese style)
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.rightToLeft}
                        onChange={() =>
                          handleToggle("rightToLeft", !settings.rightToLeft)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
                    </div>
                  </label>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <label className="flex items-center justify-between py-2 cursor-pointer">
                    <span className="text-sm font-medium">Has Cover Page</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.hasCover}
                        onChange={() =>
                          handleToggle("hasCover", !settings.hasCover)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reading Experience</CardTitle>
                <CardDescription>
                  Configure how content is displayed when reading
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center justify-between py-2 cursor-pointer">
                    <span className="text-sm font-medium">Show Tooltips</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.showTooltips}
                        onChange={() =>
                          handleToggle("showTooltips", !settings.showTooltips)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between py-2 cursor-pointer">
                    <span className="text-sm font-medium">
                      Animate Page Turns
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.animatePageTurns}
                        onChange={() =>
                          handleToggle(
                            "animatePageTurns",
                            !settings.animatePageTurns
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between py-2 cursor-pointer">
                    <span className="text-sm font-medium">
                      Auto-Save Reading Position
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.autoSavePosition}
                        onChange={() =>
                          handleToggle(
                            "autoSavePosition",
                            !settings.autoSavePosition
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>
                  Control the visual appearance of MokuReader
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center justify-between py-2 cursor-pointer">
                    <span className="text-sm font-medium">Dark Mode</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.darkMode}
                        onChange={() =>
                          handleToggle("darkMode", !settings.darkMode)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between py-2 cursor-pointer">
                    <span className="text-sm font-medium">Invert Colors</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.invertColors}
                        onChange={() =>
                          handleToggle("invertColors", !settings.invertColors)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Font Size</CardTitle>
                <CardDescription>Adjust text display size</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      className={`rounded-md px-3 py-2 text-sm font-medium ${
                        settings.fontSize === "auto"
                          ? "bg-orange-600 text-white"
                          : "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                      }`}
                      onClick={() => updateSettings({ fontSize: "auto" })}
                    >
                      Auto
                    </button>
                    <button
                      className={`rounded-md px-3 py-2 text-sm font-medium ${
                        settings.fontSize === 12
                          ? "bg-orange-600 text-white"
                          : "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                      }`}
                      onClick={() => updateSettings({ fontSize: 12 })}
                    >
                      Small
                    </button>
                    <button
                      className={`rounded-md px-3 py-2 text-sm font-medium ${
                        settings.fontSize === 16
                          ? "bg-orange-600 text-white"
                          : "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                      }`}
                      onClick={() => updateSettings({ fontSize: 16 })}
                    >
                      Medium
                    </button>
                    <button
                      className={`rounded-md px-3 py-2 text-sm font-medium ${
                        settings.fontSize === 20
                          ? "bg-orange-600 text-white"
                          : "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                      }`}
                      onClick={() => updateSettings({ fontSize: 20 })}
                    >
                      Large
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Anki Integration Tab */}
        <TabsContent value="anki">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Anki Connection</CardTitle>
                <CardDescription>
                  Configure Anki integration for flashcard creation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center justify-between py-2 cursor-pointer">
                    <span className="text-sm font-medium">
                      Enable Anki Integration
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.ankiEnabled}
                        onChange={() =>
                          handleToggle("ankiEnabled", !settings.ankiEnabled)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
                    </div>
                  </label>

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <label className="text-sm font-medium mb-2 block">
                      AnkiConnect URL
                    </label>
                    <input
                      type="text"
                      defaultValue={defaultConfig.ankiConnectUrl}
                      disabled={!settings.ankiEnabled}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                      The URL where AnkiConnect is listening. Default:
                      http://localhost:8765
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Basic application configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="pt-1">
                    <label className="text-sm font-medium mb-2 block">
                      Manga Directory
                    </label>
                    <input
                      type="text"
                      defaultValue={defaultConfig.mangaDir}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800"
                    />
                    <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                      The directory where your manga files are stored. Restart
                      required.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <label className="text-sm font-medium mb-2 block">
                      Server Port
                    </label>
                    <input
                      type="number"
                      defaultValue={defaultConfig.serverPort}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800"
                    />
                    <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                      The port on which the application server runs. Restart
                      required.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <label className="text-sm font-medium mb-2 block">
                      Application Name
                    </label>
                    <input
                      type="text"
                      defaultValue={defaultConfig.siteName}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800"
                    />
                    <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                      The name displayed in the browser title and application
                      header.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {isUpdating && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-md px-4 py-2 flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
          <span className="text-sm">Updating settings...</span>
        </div>
      )}
    </div>
  );
}
