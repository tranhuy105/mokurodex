import { create } from 'zustand';

interface CacheStore {
  images: Record<string, string>; // volumeId_pageNumber -> base64 image
  addImage: (key: string, image: string) => void;
  getImage: (key: string) => string | undefined;
  hasImage: (key: string) => boolean;
  clearCache: () => void;
}

export const useCache = create<CacheStore>((set, get) => ({
  images: {},
  addImage: (key: string, image: string) =>
    set((state) => ({ images: { ...state.images, [key]: image } })),
  getImage: (key: string) => get().images[key],
  hasImage: (key: string) => key in get().images,
  clearCache: () => set({ images: {} })
}));
