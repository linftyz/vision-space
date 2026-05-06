import { create } from "zustand";
import { clamp, normalizeRotation } from "@/lib/format";
import type {
  FitMode,
  ImageCollection,
  ImageFile,
  ImageMetadata,
  RecentItem,
  SortMode,
  ThemeAccent,
  ThemeMode,
  ViewerPreferences,
  ViewerRecents,
} from "@/types/viewer";

type ViewerState = {
  collection: ImageCollection | null;
  currentIndex: number;
  fitMode: FitMode;
  sortMode: SortMode;
  recentFiles: RecentItem[];
  recentFolders: RecentItem[];
  themeAccent: ThemeAccent;
  themeMode: ThemeMode;
  showFilmstrip: boolean;
  showInfoPanel: boolean;
  loadingMessage: string | null;
  loadError: string | null;
  imageMetadata: ImageMetadata | null;
  imageMetadataStatus: "idle" | "loading" | "loaded" | "error";
  zoom: number;
  rotation: number;
  pan: { x: number; y: number };
  imageSize: { width: number; height: number } | null;
  setCollection: (collection: ImageCollection) => void;
  setCurrentIndex: (index: number) => void;
  next: () => void;
  previous: () => void;
  setFitMode: (fitMode: FitMode) => void;
  setSortMode: (sortMode: SortMode) => void;
  setRecentItems: (items: {
    recentFiles: RecentItem[];
    recentFolders: RecentItem[];
  }) => void;
  setThemeAccent: (themeAccent: ThemeAccent) => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  setShowFilmstrip: (showFilmstrip: boolean) => void;
  setShowInfoPanel: (showInfoPanel: boolean) => void;
  toggleInfoPanel: () => void;
  setLoadingMessage: (message: string | null) => void;
  setLoadError: (message: string | null) => void;
  setImageMetadata: (imageMetadata: ImageMetadata | null) => void;
  setImageMetadataStatus: (
    imageMetadataStatus: "idle" | "loading" | "loaded" | "error",
  ) => void;
  setZoom: (zoom: number) => void;
  setRotation: (rotation: number) => void;
  rotateClockwise: () => void;
  setPan: (pan: { x: number; y: number }) => void;
  setImageSize: (imageSize: { width: number; height: number } | null) => void;
  resetView: () => void;
};

export const defaultPreferences: ViewerPreferences = {
  fitMode: "fit",
  sortMode: "nameAsc",
  themeAccent: "amber",
  themeMode: "system",
  showFilmstrip: true,
};

export const defaultRecents: ViewerRecents = {
  recentFiles: [],
  recentFolders: [],
};

export const useViewerStore = create<ViewerState>((set, get) => ({
  collection: null,
  currentIndex: 0,
  fitMode: defaultPreferences.fitMode,
  sortMode: defaultPreferences.sortMode,
  recentFiles: defaultRecents.recentFiles,
  recentFolders: defaultRecents.recentFolders,
  themeAccent: defaultPreferences.themeAccent,
  themeMode: defaultPreferences.themeMode,
  showFilmstrip: defaultPreferences.showFilmstrip,
  showInfoPanel: false,
  loadingMessage: null,
  loadError: null,
  imageMetadata: null,
  imageMetadataStatus: "idle",
  zoom: 1,
  rotation: 0,
  pan: { x: 0, y: 0 },
  imageSize: null,
  setCollection: (collection) => {
    const { sortMode } = get();
    const selectedImage = collection.images[collection.selectedIndex];
    const images = sortImages(collection.images, sortMode);
    const selectedIndex = selectedImage
      ? Math.max(
          images.findIndex((image) => image.path === selectedImage.path),
          0,
        )
      : 0;

    set({
      collection: { ...collection, images, selectedIndex },
      currentIndex: selectedIndex,
      imageMetadata: null,
      imageMetadataStatus: "idle",
      imageSize: null,
      loadError: null,
      pan: { x: 0, y: 0 },
      rotation: 0,
    });
  },
  setCurrentIndex: (index) => {
    const { collection } = get();
    if (!collection) return;

    const currentIndex = Math.min(
      Math.max(index, 0),
      collection.images.length - 1,
    );

    set({
      currentIndex,
      imageMetadata: null,
      imageMetadataStatus: "idle",
      imageSize: null,
      pan: { x: 0, y: 0 },
      rotation: 0,
    });
  },
  next: () => {
    const { collection, currentIndex, setCurrentIndex } = get();
    if (!collection) return;
    setCurrentIndex((currentIndex + 1) % collection.images.length);
  },
  previous: () => {
    const { collection, currentIndex, setCurrentIndex } = get();
    if (!collection) return;
    setCurrentIndex(
      (currentIndex - 1 + collection.images.length) % collection.images.length,
    );
  },
  setFitMode: (fitMode) => set({ fitMode }),
  setSortMode: (sortMode) => {
    const { collection, currentIndex } = get();
    if (!collection) {
      set({ sortMode });
      return;
    }

    const selectedImage = collection.images[currentIndex];
    const images = sortImages(collection.images, sortMode);
    const nextIndex = selectedImage
      ? Math.max(
          images.findIndex((image) => image.path === selectedImage.path),
          0,
        )
      : 0;

    set({
      sortMode,
      collection: { ...collection, images, selectedIndex: nextIndex },
      currentIndex: nextIndex,
    });
  },
  setRecentItems: ({ recentFiles, recentFolders }) =>
    set({ recentFiles, recentFolders }),
  setThemeAccent: (themeAccent) => set({ themeAccent }),
  setThemeMode: (themeMode) => set({ themeMode }),
  setShowFilmstrip: (showFilmstrip) => set({ showFilmstrip }),
  setShowInfoPanel: (showInfoPanel) => set({ showInfoPanel }),
  toggleInfoPanel: () =>
    set((state) => ({ showInfoPanel: !state.showInfoPanel })),
  setLoadingMessage: (message) => set({ loadingMessage: message }),
  setLoadError: (message) => set({ loadError: message }),
  setImageMetadata: (imageMetadata) => set({ imageMetadata }),
  setImageMetadataStatus: (imageMetadataStatus) => set({ imageMetadataStatus }),
  setZoom: (zoom) =>
    set({
      fitMode: "free",
      zoom: clamp(zoom, 0.05, 12),
    }),
  setRotation: (rotation) => set({ rotation: normalizeRotation(rotation) }),
  rotateClockwise: () =>
    set((state) => ({ rotation: normalizeRotation(state.rotation + 90) })),
  setPan: (pan) => set({ pan }),
  setImageSize: (imageSize) => set({ imageSize }),
  resetView: () => set({ pan: { x: 0, y: 0 }, rotation: 0 }),
}));

function sortImages(images: ImageFile[], sortMode: SortMode) {
  return [...images].sort((a, b) => {
    if (sortMode === "nameAsc" || sortMode === "nameDesc") {
      const value = compareNames(a.name, b.name);
      return sortMode === "nameAsc" ? value : -value;
    }

    if (sortMode === "modifiedAsc" || sortMode === "modifiedDesc") {
      const value = compareNumbers(a.modifiedMs ?? 0, b.modifiedMs ?? 0);
      return sortMode === "modifiedAsc" ? value : -value;
    }

    const value = compareNumbers(a.size, b.size);
    return sortMode === "sizeAsc" ? value : -value;
  });
}

function compareNames(a: string, b: string) {
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function compareNumbers(a: number, b: number) {
  return a === b ? 0 : a - b;
}
