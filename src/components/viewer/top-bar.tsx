import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  Aperture,
  FolderOpen,
  Image as ImageIcon,
  Info,
  Maximize2,
  Minus,
  Plus,
  RotateCw,
  Space,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { RecentItemsPopover } from "@/components/viewer/recent-items-popover";
import { TooltipButton } from "@/components/viewer/tooltip-button";
import { ViewerSettingsPopover } from "@/components/viewer/viewer-settings-popover";
import { useViewerStore } from "@/stores/viewer-store";
import type { FitMode, ImageFile, RecentItem } from "@/types/viewer";

export function TopBar({
  clearRecents,
  currentImage,
  openFolder,
  openImage,
  openRecentItem,
  setFitMode,
  toggleInfoPanel,
  toggleFilmstrip,
  zoomBy,
}: {
  clearRecents: () => Promise<void>;
  currentImage: ImageFile | null;
  openFolder: () => Promise<void>;
  openImage: () => Promise<void>;
  openRecentItem: (item: RecentItem) => Promise<void>;
  setFitMode: (fitMode: Exclude<FitMode, "free">) => void;
  toggleInfoPanel: () => void;
  toggleFilmstrip: (value: boolean) => void;
  zoomBy: (delta: number) => void;
}) {
  const collection = useViewerStore((state) => state.collection);
  const currentIndex = useViewerStore((state) => state.currentIndex);
  const zoom = useViewerStore((state) => state.zoom);
  const rotateClockwise = useViewerStore((state) => state.rotateClockwise);
  const imageCount = collection?.images.length ?? 0;
  const isCompactWidth = useMediaQuery({ max: 920 });
  const isShortViewport = useMediaQuery("(max-height: 760px)");
  const isTinyViewport = useMediaQuery({ max: 520 });
  const isCompactToolbar = isCompactWidth || isShortViewport;
  const iconSize = isCompactToolbar ? "icon-sm" : "icon";

  return (
    <header
      className={cn(
        "z-20 flex shrink-0 items-center justify-between gap-2 border-b bg-background/82 text-foreground shadow-2xl shadow-black/20 backdrop-blur-xl",
        isCompactToolbar
          ? "min-h-12 px-2 py-1.5 sm:px-2.5"
          : "min-h-14 px-2.5 py-2 sm:gap-3 sm:px-3",
      )}
    >
      <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg border bg-primary text-primary-foreground shadow-sm",
            isCompactToolbar ? "size-7" : "size-8",
          )}
        >
          <Aperture aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div
            className={cn(
              "truncate font-heading font-semibold",
              isCompactToolbar ? "text-[13px]" : "text-sm",
            )}
          >
            {currentImage?.name ?? "Vision Space"}
          </div>
          {!isTinyViewport ? (
            <div className="truncate text-muted-foreground text-xs leading-4">
              {collection
                ? `${currentIndex + 1} of ${imageCount}`
                : "A quiet native image viewer"}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5">
        <TooltipButton
          label="Open image"
          onClick={() => void openImage()}
          shortcut="⌘O"
          size={iconSize}
        >
          <ImageIcon aria-hidden="true" />
        </TooltipButton>
        <TooltipButton
          label="Open folder"
          onClick={() => void openFolder()}
          shortcut="⇧⌘O"
          size={iconSize}
        >
          <FolderOpen aria-hidden="true" />
        </TooltipButton>
        <RecentItemsPopover
          clearRecents={clearRecents}
          openFolder={openFolder}
          openImage={openImage}
          openRecentItem={openRecentItem}
        />

        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

        <TooltipButton
          className="hidden sm:block"
          label="Zoom out"
          onClick={() => zoomBy(1 / 1.18)}
          size={iconSize}
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
          size={iconSize}
        >
          <Plus aria-hidden="true" />
        </TooltipButton>
        <TooltipButton
          className={cn("hidden sm:block", isShortViewport && "sm:hidden md:block")}
          label="Toggle info panel"
          onClick={toggleInfoPanel}
          shortcut="I"
          size={iconSize}
        >
          <Info aria-hidden="true" />
        </TooltipButton>
        <TooltipButton
          className={cn("hidden md:block", isCompactToolbar && "md:hidden")}
          label="Fit to window"
          onClick={() => setFitMode("fit")}
          size={iconSize}
        >
          <Space aria-hidden="true" />
        </TooltipButton>
        <TooltipButton
          className={cn("hidden md:block", isCompactToolbar && "md:hidden")}
          label="Rotate clockwise"
          onClick={rotateClockwise}
          size={iconSize}
        >
          <RotateCw aria-hidden="true" />
        </TooltipButton>

        <ViewerSettingsPopover
          setFitMode={setFitMode}
          toggleFilmstrip={toggleFilmstrip}
          zoomBy={zoomBy}
        />

        <TooltipButton
          className={cn("hidden sm:block", isCompactToolbar && "sm:hidden lg:block")}
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
          size={iconSize}
        >
          <Maximize2 aria-hidden="true" />
        </TooltipButton>
      </div>
    </header>
  );
}
