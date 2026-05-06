import { isTauri } from "@tauri-apps/api/core";
import { Menu } from "@tauri-apps/api/menu";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";
import { showError } from "@/services/toasts";
import { applyTheme, subscribeSystemTheme } from "@/services/theme";
import {
  assetUrl,
  loadImageMetadata,
  loadPreferences,
  loadRecents,
} from "@/services/tauri-viewer";
import { useViewerStore } from "@/stores/viewer-store";
import type { useViewerActions } from "@/hooks/use-viewer-actions";

type ViewerActions = ReturnType<typeof useViewerActions>;

export function useViewerPreferences() {
  useEffect(() => {
    void loadPreferences().then((preferences) => {
      useViewerStore.getState().setFitMode(preferences.fitMode);
      useViewerStore.getState().setSortMode(preferences.sortMode);
      useViewerStore.getState().setThemeAccent(preferences.themeAccent);
      useViewerStore.getState().setThemeMode(preferences.themeMode);
      useViewerStore.getState().setShowFilmstrip(preferences.showFilmstrip);
    });
    void loadRecents().then((recents) => {
      useViewerStore.getState().setRecentItems(recents);
    });
  }, []);
}

export function useThemeSync() {
  const themeAccent = useViewerStore((state) => state.themeAccent);
  const themeMode = useViewerStore((state) => state.themeMode);

  useEffect(() => {
    applyTheme(themeMode, themeAccent);

    if (themeMode !== "system") return;
    return subscribeSystemTheme(() => applyTheme(themeMode, themeAccent));
  }, [themeAccent, themeMode]);
}

export function useDragAndDrop(loadPaths: ViewerActions["loadPaths"]) {
  useEffect(() => {
    if (!isTauri()) return;

    let unlisten: (() => void) | undefined;
    void getCurrentWebview()
      .onDragDropEvent((event) => {
        if (event.payload.type === "drop") {
          void loadPaths(event.payload.paths);
        }
      })
      .then((callback) => {
        unlisten = callback;
      });

    return () => unlisten?.();
  }, [loadPaths]);
}

export function useAppMenu({
  openFolder,
  openImage,
  setFitMode,
  toggleInfoPanel,
  zoomBy,
}: Pick<
  ViewerActions,
  "openFolder" | "openImage" | "setFitMode" | "toggleInfoPanel" | "zoomBy"
>) {
  useEffect(() => {
    if (!isTauri()) return;

    let mounted = true;
    void Menu.new({
      items: [
        {
          id: "file",
          text: "File",
          items: [
            {
              id: "open-image",
              text: "Open Image...",
              accelerator: "CmdOrCtrl+O",
              action: () => void openImage(),
            },
            {
              id: "open-folder",
              text: "Open Folder...",
              accelerator: "CmdOrCtrl+Shift+O",
              action: () => void openFolder(),
            },
            { item: "Separator" },
            { item: "CloseWindow", text: "Close Window" },
            { item: "Quit", text: "Quit Vision Space" },
          ],
        },
        {
          id: "view",
          text: "View",
          items: [
            {
              id: "zoom-in",
              text: "Zoom In",
              accelerator: "CmdOrCtrl+=",
              action: () => zoomBy(1.18),
            },
            {
              id: "zoom-out",
              text: "Zoom Out",
              accelerator: "CmdOrCtrl+-",
              action: () => zoomBy(1 / 1.18),
            },
            {
              id: "actual-size",
              text: "Actual Size",
              accelerator: "CmdOrCtrl+0",
              action: () => setFitMode("actual"),
            },
            {
              id: "fit-window",
              text: "Fit to Window",
              accelerator: "CmdOrCtrl+1",
              action: () => setFitMode("fit"),
            },
            {
              id: "toggle-info",
              text: "Toggle Info Panel",
              accelerator: "CmdOrCtrl+I",
              action: toggleInfoPanel,
            },
            { item: "Separator" },
            { item: "Fullscreen", text: "Enter Full Screen" },
          ],
        },
      ],
    })
      .then((menu) => (mounted ? menu.setAsAppMenu() : null))
      .catch(showError);

    return () => {
      mounted = false;
    };
  }, [openFolder, openImage, setFitMode, toggleInfoPanel, zoomBy]);
}

export function useViewerShortcuts({
  setFitMode,
  toggleInfoPanel,
  zoomBy,
}: Pick<ViewerActions, "setFitMode" | "toggleInfoPanel" | "zoomBy">) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      const store = useViewerStore.getState();

      if (event.key === "ArrowRight") {
        event.preventDefault();
        store.next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        store.previous();
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomBy(1.18);
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        zoomBy(1 / 1.18);
      } else if (event.key === "0") {
        event.preventDefault();
        setFitMode("actual");
      } else if (event.key === " ") {
        event.preventDefault();
        setFitMode("fit");
      } else if (event.key.toLowerCase() === "i" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        toggleInfoPanel();
      } else if (event.key === "Escape" && isTauri()) {
        event.preventDefault();
        void getCurrentWindow().setFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setFitMode, toggleInfoPanel, zoomBy]);
}

export function useAdjacentImagePreload() {
  const collection = useViewerStore((state) => state.collection);
  const currentIndex = useViewerStore((state) => state.currentIndex);

  useEffect(() => {
    if (!collection) return;

    const preloadIndexes = [currentIndex - 1, currentIndex + 1].filter(
      (index) => index >= 0 && index < collection.images.length,
    );
    const preloadedImages = preloadIndexes.map((index) => {
      const image = new window.Image();
      image.decoding = "async";
      image.src = assetUrl(collection.images[index].path);
      return image;
    });

    return () => {
      preloadedImages.forEach((image) => {
        image.src = "";
      });
    };
  }, [collection, currentIndex]);
}

export function useImageMetadata(currentImagePath: string | null) {
  const showInfoPanel = useViewerStore((state) => state.showInfoPanel);

  useEffect(() => {
    if (!currentImagePath || !showInfoPanel) {
      useViewerStore.getState().setImageMetadata(null);
      useViewerStore.getState().setImageMetadataStatus("idle");
      return;
    }

    let cancelled = false;
    const store = useViewerStore.getState();
    store.setImageMetadataStatus("loading");

    void loadImageMetadata(currentImagePath)
      .then((imageMetadata) => {
        if (cancelled) return;
        useViewerStore.getState().setImageMetadata(imageMetadata);
        useViewerStore.getState().setImageMetadataStatus("loaded");
      })
      .catch((error) => {
        if (cancelled) return;
        showError(error);
        useViewerStore.getState().setImageMetadata(null);
        useViewerStore.getState().setImageMetadataStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [currentImagePath, showInfoPanel]);
}
