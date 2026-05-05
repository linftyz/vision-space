import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  Aperture,
  FolderOpen,
  Image as ImageIcon,
  Maximize2,
  Minus,
  Plus,
  RotateCw,
  Space,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { RecentItemsPopover } from "@/components/viewer/recent-items-popover";
import { TooltipButton } from "@/components/viewer/tooltip-button";
import { ViewerSettingsPopover } from "@/components/viewer/viewer-settings-popover";
import { useViewerStore } from "@/stores/viewer-store";
import type { FitMode, ImageFile, RecentItem } from "@/types/viewer";

export function TopBar({
  currentImage,
  openFolder,
  openImage,
  openRecentItem,
  setFitMode,
  toggleFilmstrip,
  zoomBy,
}: {
  currentImage: ImageFile | null;
  openFolder: () => Promise<void>;
  openImage: () => Promise<void>;
  openRecentItem: (item: RecentItem) => Promise<void>;
  setFitMode: (fitMode: Exclude<FitMode, "free">) => void;
  toggleFilmstrip: (value: boolean) => void;
  zoomBy: (delta: number) => void;
}) {
  const collection = useViewerStore((state) => state.collection);
  const currentIndex = useViewerStore((state) => state.currentIndex);
  const zoom = useViewerStore((state) => state.zoom);
  const rotateClockwise = useViewerStore((state) => state.rotateClockwise);
  const imageCount = collection?.images.length ?? 0;

  return (
    <header className="z-20 flex min-h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/82 px-2.5 py-2 text-foreground shadow-2xl shadow-black/20 backdrop-blur-xl sm:gap-3 sm:px-3">
      <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-primary text-primary-foreground shadow-sm sm:size-8">
          <Aperture aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="truncate font-heading font-semibold text-sm">
            {currentImage?.name ?? "Vision Space"}
          </div>
          <div className="truncate text-muted-foreground text-xs leading-4">
            {collection
              ? `${currentIndex + 1} of ${imageCount}`
              : "A quiet native image viewer"}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5">
        <TooltipButton
          label="Open image"
          onClick={() => void openImage()}
          shortcut="⌘O"
        >
          <ImageIcon aria-hidden="true" />
        </TooltipButton>
        <TooltipButton
          label="Open folder"
          onClick={() => void openFolder()}
          shortcut="⇧⌘O"
        >
          <FolderOpen aria-hidden="true" />
        </TooltipButton>
        <RecentItemsPopover openRecentItem={openRecentItem} />

        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

        <TooltipButton
          className="hidden sm:block"
          label="Zoom out"
          onClick={() => zoomBy(1 / 1.18)}
        >
          <Minus aria-hidden="true" />
        </TooltipButton>
        <div className="hidden grid-cols-[minmax(7rem,10rem)_3.25rem] items-center gap-2 px-1 min-[1180px]:grid min-[1400px]:grid-cols-[minmax(10rem,14rem)_3.25rem]">
          <Slider
            aria-label="Zoom"
            max={400}
            min={10}
            onValueChange={(value) => {
              const nextValue = Array.isArray(value) ? value[0] : value;
              useViewerStore.getState().setZoom(nextValue / 100);
            }}
            step={5}
            value={Math.round(zoom * 100)}
          />
          <span className="text-right text-muted-foreground text-xs tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
        </div>
        <TooltipButton
          className="hidden sm:block"
          label="Zoom in"
          onClick={() => zoomBy(1.18)}
        >
          <Plus aria-hidden="true" />
        </TooltipButton>
        <TooltipButton
          className="hidden md:block"
          label="Fit to window"
          onClick={() => setFitMode("fit")}
        >
          <Space aria-hidden="true" />
        </TooltipButton>
        <TooltipButton
          className="hidden md:block"
          label="Rotate clockwise"
          onClick={rotateClockwise}
        >
          <RotateCw aria-hidden="true" />
        </TooltipButton>

        <ViewerSettingsPopover
          setFitMode={setFitMode}
          toggleFilmstrip={toggleFilmstrip}
          zoomBy={zoomBy}
        />

        <TooltipButton
          className="hidden sm:block"
          label="Toggle full screen"
          onClick={() => {
            if (isTauri()) {
              void getCurrentWindow()
                .isFullscreen()
                .then((fullscreen) =>
                  getCurrentWindow().setFullscreen(!fullscreen),
                );
            }
          }}
        >
          <Maximize2 aria-hidden="true" />
        </TooltipButton>
      </div>
    </header>
  );
}
