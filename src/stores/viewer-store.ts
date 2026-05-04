import { create } from "zustand";
import { clamp, normalizeRotation } from "@/lib/format";
import type {
  FitMode,
  ImageCollection,
  ThemeAccent,
  ThemeMode,
  ViewerPreferences,
} from "@/types/viewer";

type ViewerState = {
  collection: ImageCollection | null;
  currentIndex: number;
  fitMode: FitMode;
  themeAccent: ThemeAccent;
  themeMode: ThemeMode;
  showFilmstrip: boolean;
  zoom: number;
  rotation: number;
  pan: { x: number; y: number };
  imageSize: { width: number; height: number } | null;
  setCollection: (collection: ImageCollection) => void;
  setCurrentIndex: (index: number) => void;
  next: () => void;
  previous: () => void;
  setFitMode: (fitMode: FitMode) => void;
  setThemeAccent: (themeAccent: ThemeAccent) => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  setShowFilmstrip: (showFilmstrip: boolean) => void;
  setZoom: (zoom: number) => void;
  setRotation: (rotation: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setImageSize: (imageSize: { width: number; height: number } | null) => void;
  resetView: () => void;
};

export const defaultPreferences: ViewerPreferences = {
  fitMode: "fit",
  themeAccent: "amber",
  themeMode: "system",
  showFilmstrip: true,
};

export const useViewerStore = create<ViewerState>((set, get) => ({
  collection: null,
  currentIndex: 0,
  fitMode: defaultPreferences.fitMode,
  themeAccent: defaultPreferences.themeAccent,
  themeMode: defaultPreferences.themeMode,
  showFilmstrip: defaultPreferences.showFilmstrip,
  zoom: 1,
  rotation: 0,
  pan: { x: 0, y: 0 },
  imageSize: null,
  setCollection: (collection) =>
    set({
      collection,
      currentIndex: collection.selectedIndex,
      imageSize: null,
      pan: { x: 0, y: 0 },
      rotation: 0,
    }),
  setCurrentIndex: (index) => {
    const { collection } = get();
    if (!collection) return;

    const currentIndex = Math.min(
      Math.max(index, 0),
      collection.images.length - 1,
    );

    set({
      currentIndex,
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
  setThemeAccent: (themeAccent) => set({ themeAccent }),
  setThemeMode: (themeMode) => set({ themeMode }),
  setShowFilmstrip: (showFilmstrip) => set({ showFilmstrip }),
  setZoom: (zoom) =>
    set({
      fitMode: "free",
      zoom: clamp(zoom, 0.05, 12),
    }),
  setRotation: (rotation) => set({ rotation: normalizeRotation(rotation) }),
  setPan: (pan) => set({ pan }),
  setImageSize: (imageSize) => set({ imageSize }),
  resetView: () => set({ pan: { x: 0, y: 0 }, rotation: 0 }),
}));
