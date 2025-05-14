export const config = {
  mangaDir: process.env.MANGA_DIR || "./public/MANGA",
  ankiConnectUrl: process.env.ANKI_CONNECT_URL || "http://localhost:8765",
} as const;
