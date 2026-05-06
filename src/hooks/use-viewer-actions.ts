import { isTauri } from "@tauri-apps/api/core";
import { useCallback } from "react";
import { showError, showInfo, showSuccess } from "@/services/toasts";
import {
  clearRecentItems,
  copyTextToClipboard,
  loadCollection,
  openFolderDialog,
  openImageDialog,
  revealInFinder,
  removeRecentItem,
  savePreference,
} from "@/services/tauri-viewer";
import { useViewerStore } from "@/stores/viewer-store";
import type { FitMode, RecentItem } from "@/types/viewer";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function useViewerActions() {
  const loadPaths = useCallback(
    async (
      paths: string[],
      recentItem?: Pick<RecentItem, "kind" | "path">,
    ) => {
      if (!isTauri()) {
        showInfo(
          "Run inside Tauri",
          "Native file access is available in the desktop app.",
        );
        return;
      }

      const store = useViewerStore.getState();
      store.setLoadError(null);
      store.setLoadingMessage(paths.length > 1 ? "Opening dropped items..." : "Opening...");

      try {
        await loadCollection(paths, recentItem);
      } catch (error) {
        useViewerStore.getState().setLoadError(errorMessage(error));
        showError(error);
      } finally {
        useViewerStore.getState().setLoadingMessage(null);
      }
    },
    [],
  );

  const openImage = useCallback(async () => {
    if (!isTauri()) {
      showInfo("Run inside Tauri", "The browser preview cannot open local files.");
      return;
    }

    const selected = await openImageDialog();
    if (selected) {
      await loadPaths([selected], { kind: "file", path: selected });
    }
  }, [loadPaths]);

  const openFolder = useCallback(async () => {
    if (!isTauri()) {
      showInfo("Run inside Tauri", "The browser preview cannot open folders.");
      return;
    }

    const selected = await openFolderDialog();
    if (selected) {
      await loadPaths([selected], { kind: "folder", path: selected });
    }
  }, [loadPaths]);

  const openRecentItem = useCallback(async (item: RecentItem) => {
    if (!isTauri()) {
      showInfo("Run inside Tauri", "Recent items are available in the desktop app.");
      return;
    }

    try {
      const store = useViewerStore.getState();
      store.setLoadError(null);
      store.setLoadingMessage(`Opening ${item.name}...`);
      await loadCollection([item.path], item);
    } catch (error) {
      await removeRecentItem(item.kind, item.path);
      useViewerStore.getState().setLoadError(errorMessage(error));
      showError(error);
    } finally {
      useViewerStore.getState().setLoadingMessage(null);
    }
  }, []);

  const zoomBy = useCallback((delta: number) => {
    const { zoom, setZoom } = useViewerStore.getState();
    setZoom(zoom * delta);
  }, []);

  const clearRecents = useCallback(async () => {
    if (!isTauri()) {
      showInfo("Run inside Tauri", "Recent items are available in the desktop app.");
      return;
    }

    await clearRecentItems();
    showSuccess("Recents cleared");
  }, []);

  const copyPath = useCallback(async (path: string) => {
    try {
      await copyTextToClipboard(path);
      showSuccess("Path copied", path);
    } catch (error) {
      showError(error);
    }
  }, []);

  const revealPath = useCallback(async (path: string) => {
    if (!isTauri()) {
      showInfo("Run inside Tauri", "Reveal in Finder is available in the desktop app.");
      return;
    }

    try {
      await revealInFinder(path);
    } catch (error) {
      showError(error);
    }
  }, []);

  const toggleInfoPanel = useCallback(() => {
    useViewerStore.getState().toggleInfoPanel();
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
    clearRecents,
    copyPath,
    openFolder,
    openImage,
    openRecentItem,
    revealPath,
    setFitMode,
    toggleFilmstrip,
    toggleInfoPanel,
    zoomBy,
  };
}
