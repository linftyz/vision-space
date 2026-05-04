import { useEffect, useRef } from "react";
import { PanelBottom } from "lucide-react";
import { cn } from "@/lib/utils";
import { assetUrl } from "@/services/tauri-viewer";
import { useViewerStore } from "@/stores/viewer-store";

export function Filmstrip() {
  const collection = useViewerStore((state) => state.collection);
  const currentIndex = useViewerStore((state) => state.currentIndex);
  const showFilmstrip = useViewerStore((state) => state.showFilmstrip);
  const setCurrentIndex = useViewerStore((state) => state.setCurrentIndex);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    itemRefs.current[currentIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [currentIndex]);

  if (!collection || !showFilmstrip) return null;

  return (
    <footer className="z-20 flex h-20 shrink-0 items-center gap-2 border-t bg-background/86 px-2.5 backdrop-blur-xl sm:h-24 sm:px-3">
      <PanelBottom aria-hidden="true" className="hidden shrink-0 text-muted-foreground lg:block" />
      <div className="viewer-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-2 sm:gap-2">
        {collection.images.map((image, index) => (
          <button
            aria-label={`Show ${image.name}`}
            className={cn(
              "relative h-14 w-16 shrink-0 overflow-hidden rounded-md border bg-muted outline-none transition focus-visible:ring-2 focus-visible:ring-ring sm:h-16 sm:w-20",
              index === currentIndex
                ? "border-primary shadow-md shadow-primary/20"
                : "hover:border-primary/40",
            )}
            key={image.path}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            onClick={() => setCurrentIndex(index)}
            type="button"
          >
            <img
              alt=""
              className="size-full object-cover"
              draggable={false}
              src={assetUrl(image.path)}
            />
            <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1 py-0.5 text-[10px] text-white">
              {image.name}
            </span>
          </button>
        ))}
      </div>
      <div className="hidden w-16 shrink-0 text-right text-muted-foreground text-xs tabular-nums sm:block">
        {currentIndex + 1}/{collection.images.length}
      </div>
    </footer>
  );
}
