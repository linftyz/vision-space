import { useEffect, useMemo, useRef, useState } from "react";
import { ImageOff, PanelBottom } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useElementSize } from "@/hooks/use-element-size";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { assetUrl } from "@/services/tauri-viewer";
import { useViewerStore } from "@/stores/viewer-store";
import type { ImageFile } from "@/types/viewer";

const OVERSCAN_ITEMS = 8;

export function Filmstrip() {
  const collection = useViewerStore((state) => state.collection);
  const currentIndex = useViewerStore((state) => state.currentIndex);
  const showFilmstrip = useViewerStore((state) => state.showFilmstrip);
  const setCurrentIndex = useViewerStore((state) => state.setCurrentIndex);
  const isWide = useMediaQuery("sm");
  const [viewportRef, viewportSize] = useElementSize<HTMLDivElement>();
  const [scrollLeft, setScrollLeft] = useState(0);
  const rafRef = useRef<number | null>(null);
  const itemWidth = isWide ? 80 : 64;
  const itemHeight = isWide ? 64 : 56;
  const itemGap = isWide ? 8 : 6;
  const itemStride = itemWidth + itemGap;
  const images = collection?.images ?? [];
  const totalWidth = Math.max(images.length * itemStride - itemGap, itemWidth);
  const canScroll = totalWidth > viewportSize.width + 1;
  const showLeftFade = canScroll && scrollLeft > 1;
  const showRightFade =
    canScroll && scrollLeft + viewportSize.width < totalWidth - 1;

  useEffect(() => {
    setScrollLeft(0);
    viewportRef.current?.scrollTo({ left: 0 });
  }, [collection?.rootPath, viewportRef]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || images.length === 0) return;

    const itemStart = currentIndex * itemStride;
    const itemEnd = itemStart + itemWidth;
    const viewportStart = viewport.scrollLeft;
    const viewportEnd = viewportStart + viewport.clientWidth;

    if (itemStart >= viewportStart && itemEnd <= viewportEnd) return;

    viewport.scrollTo({
      behavior: "smooth",
      left: Math.max(itemStart - (viewport.clientWidth - itemWidth) / 2, 0),
    });
  }, [currentIndex, images.length, itemStride, itemWidth, viewportRef]);

  const visibleRange = useMemo(() => {
    if (images.length === 0) return { end: 0, start: 0 };

    const start = Math.max(
      Math.floor(scrollLeft / itemStride) - OVERSCAN_ITEMS,
      0,
    );
    const end = Math.min(
      Math.ceil((scrollLeft + viewportSize.width) / itemStride) +
        OVERSCAN_ITEMS,
      images.length,
    );

    return { end, start };
  }, [images.length, itemStride, scrollLeft, viewportSize.width]);

  const visibleImages = useMemo(
    () => images.slice(visibleRange.start, visibleRange.end),
    [images, visibleRange.end, visibleRange.start],
  );

  useEffect(
    () => () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    },
    [],
  );

  if (!collection || !showFilmstrip) return null;

  return (
    <footer className="z-20 flex h-20 shrink-0 items-center gap-2 border-t bg-background/86 px-2.5 backdrop-blur-xl sm:h-24 sm:px-3">
      <PanelBottom aria-hidden="true" className="hidden shrink-0 text-muted-foreground lg:block" />
      <div className="relative min-w-0 flex-1">
        <div
          className="viewer-scrollbar min-w-0 overflow-x-auto py-2"
          onScroll={(event) => {
            const nextScrollLeft = event.currentTarget.scrollLeft;
            if (rafRef.current !== null) return;
            rafRef.current = requestAnimationFrame(() => {
              setScrollLeft(nextScrollLeft);
              rafRef.current = null;
            });
          }}
          ref={viewportRef}
        >
          <div
            className="relative"
            style={{ height: itemHeight, width: totalWidth }}
          >
            {visibleImages.map((image, offset) => {
              const index = visibleRange.start + offset;
              return (
                <ThumbnailTile
                  currentIndex={currentIndex}
                  image={image}
                  index={index}
                  itemHeight={itemHeight}
                  itemStride={itemStride}
                  itemWidth={itemWidth}
                  key={image.path}
                  onSelect={setCurrentIndex}
                />
              );
            })}
          </div>
        </div>
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-2 left-0 w-6 rounded-l-md bg-gradient-to-r from-background/92 to-transparent transition-opacity",
            showLeftFade ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-2 right-0 w-6 rounded-r-md bg-gradient-to-l from-background/92 to-transparent transition-opacity",
            showRightFade ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
      <div className="hidden w-16 shrink-0 text-right text-muted-foreground text-xs tabular-nums sm:block">
        {currentIndex + 1}/{collection.images.length}
      </div>
    </footer>
  );
}

function ThumbnailTile({
  currentIndex,
  image,
  index,
  itemHeight,
  itemStride,
  itemWidth,
  onSelect,
}: {
  currentIndex: number;
  image: ImageFile;
  index: number;
  itemHeight: number;
  itemStride: number;
  itemWidth: number;
  onSelect: (index: number) => void;
}) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );

  useEffect(() => {
    setStatus("loading");
  }, [image.path]);

  return (
    <button
      aria-label={`Show ${image.name}`}
      className={cn(
        "absolute top-0 overflow-hidden rounded-md border bg-muted outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
        index === currentIndex
          ? "border-primary shadow-md shadow-primary/20"
          : "hover:border-primary/40",
      )}
      onClick={() => onSelect(index)}
      style={{
        height: itemHeight,
        left: index * itemStride,
        width: itemWidth,
      }}
      type="button"
    >
      {status === "loading" && <Skeleton className="absolute inset-0 rounded-none" />}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <ImageOff aria-hidden="true" className="size-4 opacity-70" />
        </div>
      )}
      <img
        alt=""
        className={cn(
          "size-full object-cover transition-opacity duration-200",
          status === "loaded" ? "opacity-100" : "opacity-0",
        )}
        decoding="async"
        draggable={false}
        loading="lazy"
        onError={() => setStatus("error")}
        onLoad={() => setStatus("loaded")}
        src={assetUrl(image.path)}
      />
      <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1 py-0.5 text-[10px] text-white">
        {image.name}
      </span>
    </button>
  );
}
