"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSettings } from "@/hooks/useSettings";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { SettingsNav } from "@/components/ui/SettingsNav";

export default function PreferencesPage() {
  const { isLoading, error, updateSettings, ...settings } = useSettings();

  const handleReadingModeChange = (
    mode: "singlePage" | "doublePage" | "longStrip"
  ) => {
    updateSettings({ readingMode: mode });
    toast.success(`Reading mode changed to ${mode}`);
  };

  const handleDirectionChange = (rightToLeft: boolean) => {
    updateSettings({ rightToLeft });
    toast.success(
      `Reading direction changed to ${
        rightToLeft ? "right to left" : "left to right"
      }`
    );
  };

  const handleThemeChange = (darkMode: boolean) => {
    updateSettings({ darkMode });
    toast.success(`Theme changed to ${darkMode ? "dark" : "light"}`);
  };

  const handleFontSizeChange = (fontSize: number | "auto") => {
    updateSettings({ fontSize });
    toast.success(
      `Font size changed to ${fontSize === "auto" ? "auto" : `${fontSize}px`}`
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-400 mb-4" />
          <p className="text-lg">Loading preferences...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Preferences"
          subtitle="Customize your reading experience"
          className="mb-4"
        />
        <SettingsNav />
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline">
            {" "}
            Failed to load preferences: {error.message}
          </span>
        </div>
        <Button
          onClick={() => window.location.reload()}
          className="bg-orange-500 hover:bg-orange-600"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <PageHeader
        title="Preferences"
        subtitle="Customize your reading experience"
        className="mb-4"
      />

      <SettingsNav />

      <div className="grid gap-6">
        {/* Reading Mode */}
        <Card>
          <CardHeader>
            <CardTitle>Reading Mode</CardTitle>
            <CardDescription>
              Choose how pages are displayed when reading
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={() => handleReadingModeChange("singlePage")}
                className={`flex flex-col items-center p-6 h-auto ${
                  settings.readingMode === "singlePage"
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                }`}
              >
                <div className="w-16 h-24 border-2 border-current mb-3"></div>
                <span>Single Page</span>
              </Button>

              <Button
                onClick={() => handleReadingModeChange("doublePage")}
                className={`flex flex-col items-center p-6 h-auto ${
                  settings.readingMode === "doublePage"
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                }`}
              >
                <div className="flex mb-3">
                  <div className="w-12 h-20 border-2 border-current mr-1"></div>
                  <div className="w-12 h-20 border-2 border-current ml-1"></div>
                </div>
                <span>Double Page</span>
              </Button>

              <Button
                onClick={() => handleReadingModeChange("longStrip")}
                className={`flex flex-col items-center p-6 h-auto ${
                  settings.readingMode === "longStrip"
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                }`}
              >
                <div className="flex flex-col mb-3">
                  <div className="w-16 h-8 border-2 border-current mb-1"></div>
                  <div className="w-16 h-8 border-2 border-current mb-1"></div>
                  <div className="w-16 h-8 border-2 border-current"></div>
                </div>
                <span>Long Strip</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reading Direction */}
        <Card>
          <CardHeader>
            <CardTitle>Reading Direction</CardTitle>
            <CardDescription>
              Set the reading direction for manga
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={() => handleDirectionChange(false)}
                className={`flex flex-col items-center p-6 h-auto ${
                  !settings.rightToLeft
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                }`}
              >
                <div className="flex mb-3">
                  <div className="flex items-center">
                    <svg
                      className="w-6 h-6 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16l-4-4m0 0l4-4m-4 4h18"
                      ></path>
                    </svg>
                    <span>Left to Right</span>
                  </div>
                </div>
                <span>Western Style</span>
              </Button>

              <Button
                onClick={() => handleDirectionChange(true)}
                className={`flex flex-col items-center p-6 h-auto ${
                  settings.rightToLeft
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                }`}
              >
                <div className="flex mb-3">
                  <div className="flex items-center">
                    <span>Right to Left</span>
                    <svg
                      className="w-6 h-6 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      ></path>
                    </svg>
                  </div>
                </div>
                <span>Japanese Style</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Choose your preferred color theme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={() => handleThemeChange(false)}
                className={`flex flex-col items-center p-6 h-auto ${
                  !settings.darkMode
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-white border border-gray-300 mb-3 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
                <span>Light</span>
              </Button>

              <Button
                onClick={() => handleThemeChange(true)}
                className={`flex flex-col items-center p-6 h-auto ${
                  settings.darkMode
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-gray-700 hover:bg-gray-600 text-white"
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-gray-800 border border-gray-600 mb-3 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-200"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                  </svg>
                </div>
                <span>Dark</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Font Size */}
        <Card>
          <CardHeader>
            <CardTitle>Font Size</CardTitle>
            <CardDescription>Set the text size for reading</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Button
                onClick={() => handleFontSizeChange("auto")}
                className={`p-4 ${
                  settings.fontSize === "auto"
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                }`}
              >
                Auto
              </Button>
              <Button
                onClick={() => handleFontSizeChange(12)}
                className={`p-4 ${
                  settings.fontSize === 12
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                }`}
              >
                <span style={{ fontSize: "12px" }}>Small (12px)</span>
              </Button>
              <Button
                onClick={() => handleFontSizeChange(16)}
                className={`p-4 ${
                  settings.fontSize === 16
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                }`}
              >
                <span style={{ fontSize: "16px" }}>Medium (16px)</span>
              </Button>
              <Button
                onClick={() => handleFontSizeChange(20)}
                className={`p-4 ${
                  settings.fontSize === 20
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                }`}
              >
                <span style={{ fontSize: "20px" }}>Large (20px)</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
            <CardDescription>Additional display options</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Show tooltips when hovering over text
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.showTooltips}
                    onChange={(e) =>
                      updateSettings({ showTooltips: e.target.checked })
                    }
                    className="sr-only peer"
                    id="showTooltips"
                  />
                  <label
                    htmlFor="showTooltips"
                    className="flex h-6 w-11 items-center rounded-full bg-gray-300 peer-checked:bg-orange-500 cursor-pointer after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"
                  ></label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Invert colors (for night reading)
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.invertColors}
                    onChange={(e) =>
                      updateSettings({ invertColors: e.target.checked })
                    }
                    className="sr-only peer"
                    id="invertColors"
                  />
                  <label
                    htmlFor="invertColors"
                    className="flex h-6 w-11 items-center rounded-full bg-gray-300 peer-checked:bg-orange-500 cursor-pointer after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"
                  ></label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">First page is cover</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.hasCover}
                    onChange={(e) =>
                      updateSettings({ hasCover: e.target.checked })
                    }
                    className="sr-only peer"
                    id="hasCover"
                  />
                  <label
                    htmlFor="hasCover"
                    className="flex h-6 w-11 items-center rounded-full bg-gray-300 peer-checked:bg-orange-500 cursor-pointer after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"
                  ></label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Enable Anki integration
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.ankiEnabled}
                    onChange={(e) =>
                      updateSettings({ ankiEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                    id="ankiEnabled"
                  />
                  <label
                    htmlFor="ankiEnabled"
                    className="flex h-6 w-11 items-center rounded-full bg-gray-300 peer-checked:bg-orange-500 cursor-pointer after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"
                  ></label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reader Behavior */}
        <Card>
          <CardHeader>
            <CardTitle>Reader Behavior</CardTitle>
            <CardDescription>
              Configure how the manga reader behaves
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Animate page turns</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.animatePageTurns}
                    onChange={(e) =>
                      updateSettings({ animatePageTurns: e.target.checked })
                    }
                    className="sr-only peer"
                    id="animatePageTurns"
                  />
                  <label
                    htmlFor="animatePageTurns"
                    className="flex h-6 w-11 items-center rounded-full bg-gray-300 peer-checked:bg-orange-500 cursor-pointer after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"
                  ></label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Automatically save reading position
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.autoSavePosition}
                    onChange={(e) =>
                      updateSettings({ autoSavePosition: e.target.checked })
                    }
                    className="sr-only peer"
                    id="autoSavePosition"
                  />
                  <label
                    htmlFor="autoSavePosition"
                    className="flex h-6 w-11 items-center rounded-full bg-gray-300 peer-checked:bg-orange-500 cursor-pointer after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"
                  ></label>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">
                  Page navigation method
                </span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Button
                    onClick={() =>
                      updateSettings({ pageNavigationMethod: "click" })
                    }
                    className={`px-2 py-1 ${
                      settings.pageNavigationMethod === "click"
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    Click
                  </Button>
                  <Button
                    onClick={() =>
                      updateSettings({ pageNavigationMethod: "tap" })
                    }
                    className={`px-2 py-1 ${
                      settings.pageNavigationMethod === "tap"
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    Tap
                  </Button>
                  <Button
                    onClick={() =>
                      updateSettings({ pageNavigationMethod: "swipe" })
                    }
                    className={`px-2 py-1 ${
                      settings.pageNavigationMethod === "swipe"
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    Swipe
                  </Button>
                  <Button
                    onClick={() =>
                      updateSettings({ pageNavigationMethod: "arrows" })
                    }
                    className={`px-2 py-1 ${
                      settings.pageNavigationMethod === "arrows"
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    Arrow Keys
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="pageMargin" className="text-sm font-medium">
                  Page margin (pixels)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    id="pageMargin"
                    type="range"
                    min="0"
                    max="50"
                    value={settings.pageMargin}
                    onChange={(e) =>
                      updateSettings({ pageMargin: parseInt(e.target.value) })
                    }
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-mono w-8">
                    {settings.pageMargin}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Text Display */}
        <Card>
          <CardHeader>
            <CardTitle>Text Display</CardTitle>
            <CardDescription>
              Configure text and furigana display options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-sm font-medium">Furigana display</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Button
                    onClick={() =>
                      updateSettings({ furiganaDisplay: "always" })
                    }
                    className={`px-2 py-1 ${
                      settings.furiganaDisplay === "always"
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    Always Show
                  </Button>
                  <Button
                    onClick={() => updateSettings({ furiganaDisplay: "hover" })}
                    className={`px-2 py-1 ${
                      settings.furiganaDisplay === "hover"
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    On Hover
                  </Button>
                  <Button
                    onClick={() => updateSettings({ furiganaDisplay: "never" })}
                    className={`px-2 py-1 ${
                      settings.furiganaDisplay === "never"
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    Never Show
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Highlight color</span>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={settings.highlightColor}
                    onChange={(e) =>
                      updateSettings({ highlightColor: e.target.value })
                    }
                    className="h-10 w-10 rounded border cursor-pointer"
                  />
                  <span className="text-sm">{settings.highlightColor}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">
                  Reader background color
                </span>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={settings.readerBackground}
                    onChange={(e) =>
                      updateSettings({ readerBackground: e.target.value })
                    }
                    className="h-10 w-10 rounded border cursor-pointer"
                  />
                  <span className="text-sm">{settings.readerBackground}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
