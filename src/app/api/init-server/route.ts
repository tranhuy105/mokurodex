import { NextResponse } from "next/server";
import { MangaService } from "@/lib/services/MangaService";
import { getRepository } from "@/lib/database/MangaRepositoryFactory";
import { ensureDataDirectory } from "@/lib/server/ensure-data-dir";
import { initializeSettings } from "@/lib/database/initSettings";

// This will be called once on server startup
let serverInitialized = false;

async function initializeServer() {
  if (serverInitialized) return;

  try {
    console.log("Initializing server...");

    // Ensure data directory for SQLite exists
    await ensureDataDirectory();

    // Initialize database by getting an instance of the repository
    await getRepository();

    try {
      // Initialize application settings
      const settingsInitialized = await initializeSettings();
      if (settingsInitialized) {
        console.log("Default settings created successfully");
      } else {
        console.log("Settings already exist or initialization failed");
      }
    } catch (settingsError) {
      console.error("Failed to initialize settings:", settingsError);
      // Continue with server initialization even if settings fail
    }

    // Preload manga data
    console.log("Preloading manga data...");
    await MangaService.getAllManga();

    console.log("Server initialization complete");
    serverInitialized = true;
  } catch (error) {
    console.error("Failed to initialize server:", error);
  }
}

export async function GET() {
  await initializeServer();
  return NextResponse.json({
    initialized: serverInitialized,
    timestamp: new Date().toISOString(),
  });
}
