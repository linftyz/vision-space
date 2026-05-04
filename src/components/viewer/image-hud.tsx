import { formatBytes } from "@/lib/format";
import { useViewerStore } from "@/stores/viewer-store";
import type { ImageFile } from "@/types/viewer";

export function ImageHud({ currentImage }: { currentImage: ImageFile }) {
  const zoom = useViewerStore((state) => state.zoom);
  const rotation = useViewerStore((state) => state.rotation);
  const imageSize = useViewerStore((state) => state.imageSize);
  const collection = useViewerStore((state) => state.collection);
  const currentIndex = useViewerStore((state) => state.currentIndex);

  return (
    <div className="right-2 bottom-2 left-2 absolute flex pointer-events-none flex-col gap-2 sm:right-4 sm:bottom-4 sm:left-4 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
      <div className="min-w-0 max-w-full rounded-lg border bg-background/82 px-3 py-2 text-xs shadow-xl shadow-black/25 backdrop-blur sm:max-w-[min(34rem,52vw)]">
        <div className="truncate font-medium">{currentImage.name}</div>
        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-muted-foreground sm:gap-x-3">
          {imageSize && (
            <span>
              {imageSize.width} x {imageSize.height}
            </span>
          )}
          <span>{formatBytes(currentImage.size)}</span>
          <span>{currentImage.extension.toUpperCase()}</span>
        </div>
      </div>
      <div className="w-fit max-w-full rounded-lg border bg-background/82 px-3 py-2 text-muted-foreground text-xs shadow-xl shadow-black/25 backdrop-blur">
        <span className="tabular-nums">{Math.round(zoom * 100)}%</span>
        <span className="mx-2">/</span>
        <span>{rotation}°</span>
        {collection && (
          <>
            <span className="mx-2">/</span>
            <span>
              {currentIndex + 1}/{collection.images.length}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
