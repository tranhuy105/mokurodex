"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  memo,
  useReducer,
} from "react";
import {
  Heart,
  ListPlus,
  Star,
  Check,
  X,
  CircleCheck,
  Clock,
  BookmarkX,
  PauseCircle,
  ListMinus,
  Loader2,
  Eye,
} from "lucide-react";
import { MangaMetadata } from "@/types/manga";
import {
  UserMangaMetadata,
  Collection,
} from "@/lib/database/DatabaseInterface";
import {
  updateUserMangaMetadata,
  getAllCollections,
  addMangaToCollection,
  removeMangaFromCollection,
} from "@/actions/manga-management-actions";

interface MangaManagementPanelProps {
  manga: MangaMetadata;
  userData: UserMangaMetadata | null;
  onUpdate?: () => void;
  isLoading?: boolean;
}

// Collection state reducer
type CollectionState = {
  collections: Collection[];
  isLoading: boolean;
  error: Error | null;
  lastFetched: number;
};

type CollectionAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Collection[] }
  | { type: "FETCH_ERROR"; payload: Error }
  | { type: "UPDATE_COLLECTION"; payload: { id: string; isSelected: boolean } };

function collectionReducer(
  state: CollectionState,
  action: CollectionAction
): CollectionState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        ...state,
        collections: action.payload,
        isLoading: false,
        error: null,
        lastFetched: Date.now(),
      };
    case "FETCH_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    case "UPDATE_COLLECTION":
      // This is for optimistic UI updates
      return state;
    default:
      return state;
  }
}

// Create a memoized collection management dialog component
const CollectionsDialog = memo(
  ({
    isOpen,
    onClose,
    collections,
    selectedIds,
    onToggle,
    isLoading,
  }: {
    isOpen: boolean;
    onClose: () => void;
    collections: Collection[];
    selectedIds: string[];
    onToggle: (id: string) => Promise<void>;
    isLoading: boolean;
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black bg-opacity-50">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Manage Collections
              </h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              </div>
            ) : collections.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-gray-500 dark:text-gray-400">
                  No collections found. Create collections to organize your
                  manga.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {collections.map((collection) => {
                  // Ensure consistent string comparison
                  const isSelected = selectedIds.some(
                    (id) => String(id) === String(collection.id)
                  );

                  return (
                    <div
                      key={collection.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div>
                        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {collection.name}
                        </h4>
                        {collection.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {collection.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onToggle(collection.id)}
                        disabled={isLoading}
                        className={`p-1.5 rounded-full ${
                          isSelected
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {isSelected ? (
                          <ListMinus className="w-5 h-5" />
                        ) : (
                          <ListPlus className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

// Add display name
CollectionsDialog.displayName = "CollectionsDialog";

// Session storage key for collections cache
const COLLECTIONS_CACHE_KEY = "manga-collections-cache";
const COLLECTIONS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function MangaManagementPanel({
  manga,
  userData,
  onUpdate,
  isLoading = false,
}: MangaManagementPanelProps) {
  // Collection state reducer
  const [collectionState, dispatchCollection] = useReducer(collectionReducer, {
    collections: [],
    isLoading: false,
    error: null,
    lastFetched: 0,
  });

  // State for user data
  const [isUpdating, setIsUpdating] = useState(false);
  const [favorite, setFavorite] = useState(userData?.favorite || false);
  const [isNsfw, setIsNsfw] = useState(userData?.isNsfw || false);
  const [rating, setRating] = useState<number | undefined>(userData?.rating);
  const [status, setStatus] = useState<
    "reading" | "completed" | "on-hold" | "dropped" | "plan-to-read" | undefined
  >(userData?.status);
  const [notes, setNotes] = useState(userData?.notes || "");
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Derived state for collections
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    userData?.collectionIds || []
  );
  const [isManagingCollections, setIsManagingCollections] = useState(false);

  // Metadata state
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [metadata, setMetadata] = useState({
    author: userData?.author || "",
    artist: userData?.artist || "",
    releaseYear: userData?.releaseYear || undefined,
    publisher: userData?.publisher || "",
  });

  // Update state when userData changes
  useEffect(() => {
    if (userData) {
      setFavorite(userData.favorite);
      setIsNsfw(userData.isNsfw || false);
      setRating(userData.rating);
      setStatus(userData.status);
      setNotes(userData.notes || "");
      setSelectedCollectionIds(userData.collectionIds || []);
      setMetadata({
        author: userData.author || "",
        artist: userData.artist || "",
        releaseYear: userData.releaseYear || undefined,
        publisher: userData.publisher || "",
      });
    }
  }, [userData]);

  // Load collections with cache support
  const loadCollections = useCallback(async () => {
    try {
      // Check session storage cache first
      const cachedData = sessionStorage.getItem(COLLECTIONS_CACHE_KEY);
      if (cachedData) {
        const { collections, timestamp } = JSON.parse(cachedData);
        const age = Date.now() - timestamp;

        if (age < COLLECTIONS_CACHE_DURATION) {
          // Use cached data if not too old
          dispatchCollection({
            type: "FETCH_SUCCESS",
            payload: collections,
          });
          return;
        }
      }

      // If cache is invalid or expired, fetch fresh data
      dispatchCollection({ type: "FETCH_START" });
      const collectionsData = await getAllCollections();

      // Store in state and cache
      dispatchCollection({
        type: "FETCH_SUCCESS",
        payload: collectionsData,
      });

      // Update cache
      sessionStorage.setItem(
        COLLECTIONS_CACHE_KEY,
        JSON.stringify({
          collections: collectionsData,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Error loading collections:", error);
      dispatchCollection({
        type: "FETCH_ERROR",
        payload: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, []);

  // Initial load of collections
  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // Optimize collection loading when dialog opens
  useEffect(() => {
    if (
      isManagingCollections &&
      collectionState.collections.length === 0 &&
      !collectionState.isLoading
    ) {
      loadCollections();
    }
  }, [
    isManagingCollections,
    collectionState.collections.length,
    collectionState.isLoading,
    loadCollections,
  ]);

  // Memoized toggle collection function
  const toggleCollection = useCallback(
    async (collectionId: string) => {
      if (isUpdating) return;

      try {
        setIsUpdating(true);
        // Use string comparison for consistency
        const isSelected = selectedCollectionIds.some(
          (id) => String(id) === String(collectionId)
        );

        // Update UI state immediately for responsive feel
        setSelectedCollectionIds((current) => {
          const newState = isSelected
            ? current.filter((id) => String(id) !== String(collectionId))
            : [...current, collectionId];
          return newState;
        });

        // Make the API call in the background
        const success = isSelected
          ? await removeMangaFromCollection(collectionId, manga.id)
          : await addMangaToCollection(collectionId, manga.id);

        if (!success) {
          // Revert the UI state if the operation failed
          console.error(
            `Failed to ${isSelected ? "remove from" : "add to"} collection`
          );
          setSelectedCollectionIds((current) => {
            const revertedState = isSelected
              ? [...current, collectionId]
              : current.filter((id) => String(id) !== String(collectionId));
            return revertedState;
          });
        }
      } catch (error) {
        console.error("Error toggling collection:", error);
        // Revert UI state on error
        setSelectedCollectionIds(userData?.collectionIds || []);
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, selectedCollectionIds, manga.id, userData]
  );

  // Save changes to user metadata with debouncing
  const saveChanges = useCallback(
    async (updates: Partial<UserMangaMetadata>) => {
      try {
        setIsUpdating(true);
        await updateUserMangaMetadata(manga.id, updates);
        onUpdate?.();
      } catch (error) {
        console.error("Error updating manga metadata:", error);
      } finally {
        setIsUpdating(false);
      }
    },
    [manga.id, onUpdate]
  );

  // Toggle favorite status
  const toggleFavorite = useCallback(async () => {
    setIsUpdating(true);
    const newFavorite = !favorite;
    setFavorite(newFavorite);

    try {
      await updateUserMangaMetadata(manga.id, { favorite: newFavorite });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setFavorite(!newFavorite); // Revert on error
    } finally {
      setIsUpdating(false);
    }
  }, [favorite, manga.id, onUpdate]);

  // Toggle NSFW status
  const toggleNsfw = useCallback(async () => {
    setIsUpdating(true);
    const newNsfw = !isNsfw;
    setIsNsfw(newNsfw);

    try {
      await updateUserMangaMetadata(manga.id, { isNsfw: newNsfw });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error toggling NSFW status:", error);
      setIsNsfw(!newNsfw); // Revert on error
    } finally {
      setIsUpdating(false);
    }
  }, [isNsfw, manga.id, onUpdate]);

  // Update rating
  const handleRatingChange = useCallback(
    async (value: number) => {
      setRating(value);
      await saveChanges({ rating: value });
    },
    [saveChanges]
  );

  // Update status
  const handleStatusChange = useCallback(
    async (
      newStatus:
        | "reading"
        | "completed"
        | "on-hold"
        | "dropped"
        | "plan-to-read"
    ) => {
      setStatus(newStatus);
      await saveChanges({ status: newStatus });
    },
    [saveChanges]
  );

  // Save notes
  const saveNotes = useCallback(async () => {
    await saveChanges({ notes });
    setIsEditingNotes(false);
  }, [notes, saveChanges]);

  // Save metadata
  const saveMetadata = useCallback(async () => {
    await saveChanges({
      author: metadata.author || undefined,
      artist: metadata.artist || undefined,
      releaseYear: metadata.releaseYear,
      publisher: metadata.publisher || undefined,
    });
    setIsEditingMetadata(false);
  }, [metadata, saveChanges]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Manage Manga
        </h3>
        {isLoading && (
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {isLoading ? (
        <div className="p-4 space-y-6 animate-pulse">
          {/* Quick Actions Row */}
          <div className="grid grid-cols-3 gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 h-20"
              >
                <div className="w-6 h-6 mb-1 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>

          {/* Other skeleton sections */}
          <div>
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"
                ></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-6">
          {/* Quick Actions Row */}
          <div className="grid grid-cols-2 gap-2">
            {/* Favorite Button */}
            <button
              onClick={toggleFavorite}
              disabled={isUpdating || isLoading}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${
                favorite
                  ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                  : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              }`}
            >
              <Heart
                className={`w-6 h-6 mb-1 ${
                  favorite
                    ? "text-red-500 fill-red-500"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {favorite ? "Favorited" : "Favorite"}
              </span>
            </button>

            {/* NSFW Button */}
            <button
              onClick={toggleNsfw}
              disabled={isUpdating || isLoading}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${
                isNsfw
                  ? "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800"
                  : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              }`}
            >
              <Eye
                className={`w-6 h-6 mb-1 ${
                  isNsfw
                    ? "text-purple-500 fill-purple-500"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {isNsfw ? "NSFW" : "Mark NSFW"}
              </span>
            </button>
          </div>

          {/* Collections Button */}
          <button
            onClick={() => setIsManagingCollections(true)}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
          >
            <ListPlus className="w-6 h-6 mb-1 text-blue-500" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Collections
            </span>
          </button>

          {/* Rating */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rating
            </h4>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingChange(star)}
                  disabled={isUpdating || isLoading}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (rating || 0) >= star
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Reading Status */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "reading", label: "Reading", icon: CircleCheck },
                { value: "completed", label: "Done", icon: Check },
                { value: "on-hold", label: "On Hold", icon: PauseCircle },
                { value: "dropped", label: "Dropped", icon: BookmarkX },
                { value: "plan-to-read", label: "Plan", icon: Clock },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() =>
                    handleStatusChange(
                      item.value as
                        | "reading"
                        | "completed"
                        | "on-hold"
                        | "dropped"
                        | "plan-to-read"
                    )
                  }
                  disabled={isUpdating || isLoading}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border ${
                    status === item.value
                      ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                      : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 mb-1 ${
                      status === item.value
                        ? "text-green-500"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes
              </h4>
              {!isEditingNotes ? (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Edit
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={saveNotes}
                    disabled={isUpdating}
                    className="text-xs text-green-500 hover:text-green-600 dark:hover:text-green-400"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setNotes(userData?.notes || "");
                      setIsEditingNotes(false);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {isEditingNotes ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 min-h-[80px]"
                placeholder="Add your notes about this manga..."
              />
            ) : (
              <div className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg min-h-[80px] text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50">
                {notes ? (
                  <p>{notes}</p>
                ) : (
                  <p className="text-gray-400 dark:text-gray-500 italic">
                    No notes added
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Metadata Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Metadata
              </h4>
              {!isEditingMetadata ? (
                <button
                  onClick={() => setIsEditingMetadata(true)}
                  className="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Edit
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={saveMetadata}
                    disabled={isUpdating}
                    className="text-xs text-green-500 hover:text-green-600 dark:hover:text-green-400"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setMetadata({
                        author: userData?.author || "",
                        artist: userData?.artist || "",
                        releaseYear: userData?.releaseYear || undefined,
                        publisher: userData?.publisher || "",
                      });
                      setIsEditingMetadata(false);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2 text-sm">
              {isEditingMetadata ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Author
                    </label>
                    <input
                      type="text"
                      value={metadata.author}
                      onChange={(e) =>
                        setMetadata({ ...metadata, author: e.target.value })
                      }
                      className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                      placeholder="Author"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Artist
                    </label>
                    <input
                      type="text"
                      value={metadata.artist}
                      onChange={(e) =>
                        setMetadata({ ...metadata, artist: e.target.value })
                      }
                      className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                      placeholder="Artist"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Year
                    </label>
                    <input
                      type="number"
                      value={metadata.releaseYear || ""}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          releaseYear: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                      placeholder="Release Year"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Publisher
                    </label>
                    <input
                      type="text"
                      value={metadata.publisher}
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          publisher: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800"
                      placeholder="Publisher"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">
                      Author
                    </span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {metadata.author || "Not set"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">
                      Artist
                    </span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {metadata.artist || "Not set"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">
                      Year
                    </span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {metadata.releaseYear || "Not set"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">
                      Publisher
                    </span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {metadata.publisher || "Not set"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Collections Dialog */}
      {isManagingCollections && (
        <CollectionsDialog
          isOpen={isManagingCollections}
          onClose={() => setIsManagingCollections(false)}
          collections={collectionState.collections}
          selectedIds={selectedCollectionIds}
          onToggle={toggleCollection}
          isLoading={collectionState.isLoading}
        />
      )}
    </div>
  );
}
