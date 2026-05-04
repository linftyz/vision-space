import { isTauri } from "@tauri-apps/api/core";
import { useCallback } from "react";
import { showError, showInfo } from "@/services/toasts";
import {
  loadCollection,
  openFolderDialog,
  openImageDialog,
  savePreference,
} from "@/services/tauri-viewer";
import { useViewerStore } from "@/stores/viewer-store";
import type { FitMode } from "@/types/viewer";

export function useViewerActions() {
  const loadPaths = useCallback(async (paths: string[]) => {
    if (!isTauri()) {
      showInfo(
        "Run inside Tauri",
        "Native file access is available in the desktop app.",
      );
      return;
    }

    try {
      await loadCollection(paths);
    } catch (error) {
      showError(error);
    }
  }, []);

  const openImage = useCallback(async () => {
    if (!isTauri()) {
      showInfo("Run inside Tauri", "The browser preview cannot open local files.");
      return;
    }

    const selected = await openImageDialog();
    if (selected) {
      await loadPaths([selected]);
    }
  }, [loadPaths]);

  const openFolder = useCallback(async () => {
    if (!isTauri()) {
      showInfo("Run inside Tauri", "The browser preview cannot open folders.");
      return;
    }

    const selected = await openFolderDialog();
    if (selected) {
      await loadPaths([selected]);
    }
  }, [loadPaths]);

  const zoomBy = useCallback((delta: number) => {
    const { zoom, setZoom } = useViewerStore.getState();
    setZoom(zoom * delta);
  }, []);

  const setFitMode = useCallback((fitMode: Exclude<FitMode, "free">) => {
    useViewerStore.getState().setFitMode(fitMode);
    void savePreference("fitMode", fitMode);
  }, []);

  const toggleFilmstrip = useCallback((value: boolean) => {
    useViewerStore.getState().setShowFilmstrip(value);
    void savePreference("showFilmstrip", value);
  }, []);

  return {
    loadPaths,
    openFolder,
    openImage,
    setFitMode,
    toggleFilmstrip,
    zoomBy,
  };
}
