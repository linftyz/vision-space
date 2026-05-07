import { Copy, FolderOpen } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatBytes, formatModifiedDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TooltipButton } from "@/components/viewer/tooltip-button";
import { useViewerStore } from "@/stores/viewer-store";
import type { ImageFile } from "@/types/viewer";

export function ImageHud({
  copyPath,
  currentImage,
  revealPath,
}: {
  copyPath: (path: string) => Promise<void>;
  currentImage: ImageFile;
  revealPath: (path: string) => Promise<void>;
}) {
  const zoom = useViewerStore((state) => state.zoom);
  const rotation = useViewerStore((state) => state.rotation);
  const imageSize = useViewerStore((state) => state.imageSize);
  const collection = useViewerStore((state) => state.collection);
  const currentIndex = useViewerStore((state) => state.currentIndex);
  const modifiedDate = formatModifiedDate(currentImage.modifiedMs);
  const isCompactWidth = useMediaQuery({ max: 720 });
  const isShortViewport = useMediaQuery("(max-height: 760px)");
  const isCompactHud = isCompactWidth || isShortViewport;

  return (
    <div
      className={cn(
        "absolute right-2 bottom-2 left-2 flex pointer-events-none flex-col gap-2",
        isCompactHud
          ? "sm:right-3 sm:bottom-3 sm:left-3"
          : "sm:right-4 sm:bottom-4 sm:left-4 sm:flex-row sm:items-end sm:justify-between sm:gap-3",
      )}
    >
      <div
        className={cn(
          "min-w-0 max-w-full rounded-lg border bg-background/82 text-xs shadow-xl shadow-black/25 backdrop-blur",
          isCompactHud
            ? "px-2.5 py-2 sm:max-w-[min(28rem,58vw)]"
            : "px-3 py-2 sm:max-w-[min(34rem,52vw)]",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{currentImage.name}</div>
          </div>
          <div className="pointer-events-auto flex shrink-0 items-center gap-1">
            <TooltipButton
              buttonClassName={cn(
                "rounded-md bg-background/18 hover:bg-background/32",
                isCompactHud ? "size-6" : "size-7",
              )}
              label="Copy path"
              onClick={() => void copyPath(currentImage.path)}
              size={isCompactHud ? "icon-xs" : "icon-sm"}
            >
              <Copy aria-hidden="true" className="size-3.5" />
            </TooltipButton>
            <TooltipButton
              buttonClassName={cn(
                "rounded-md bg-background/18 hover:bg-background/32",
                isCompactHud ? "size-6" : "size-7",
              )}
              label="Reveal in Finder"
              onClick={() => void revealPath(currentImage.path)}
              size={isCompactHud ? "icon-xs" : "icon-sm"}
            >
              <FolderOpen aria-hidden="true" className="size-3.5" />
            </TooltipButton>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-muted-foreground sm:gap-x-3">
          {imageSize ? (
            <span>
              {imageSize.width} x {imageSize.height}
            </span>
          ) : null}
          <span>{formatBytes(currentImage.size)}</span>
          <span>{currentImage.extension.toUpperCase()}</span>
          {!isCompactHud && modifiedDate ? <span>{modifiedDate}</span> : null}
        </div>
      </div>
      <div
        className={cn(
          "w-fit max-w-full rounded-lg border bg-background/82 text-muted-foreground text-xs shadow-xl shadow-black/25 backdrop-blur",
          isCompactHud ? "px-2.5 py-1.5" : "px-3 py-2",
        )}
      >
        <span className="tabular-nums">{Math.round(zoom * 100)}%</span>
        <span className="mx-2">/</span>
        <span>{rotation}°</span>
        {collection ? (
          <>
            <span className="mx-2">/</span>
            <span>
              {currentIndex + 1}/{collection.images.length}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
