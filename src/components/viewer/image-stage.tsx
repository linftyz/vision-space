import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageHud } from "@/components/viewer/image-hud";
import { useElementSize } from "@/hooks/use-element-size";
import { clamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import { showError } from "@/services/toasts";
import { assetUrl } from "@/services/tauri-viewer";
import { useViewerStore } from "@/stores/viewer-store";
import type { ImageFile } from "@/types/viewer";

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    ? Boolean(target.closest("button, a, input, textarea, select, [role='button']"))
    : false;
}

export function ImageStage({ currentImage }: { currentImage: ImageFile }) {
  const [stageRef, stageSize] = useElementSize<HTMLDivElement>();
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const zoom = useViewerStore((state) => state.zoom);
  const fitMode = useViewerStore((state) => state.fitMode);
  const rotation = useViewerStore((state) => state.rotation);
  const pan = useViewerStore((state) => state.pan);
  const imageSize = useViewerStore((state) => state.imageSize);
  const setZoom = useViewerStore((state) => state.setZoom);
  const setPan = useViewerStore((state) => state.setPan);
  const setImageSize = useViewerStore((state) => state.setImageSize);
  const next = useViewerStore((state) => state.next);
  const previous = useViewerStore((state) => state.previous);

  const computedZoom = useMemo(() => {
    if (!imageSize || stageSize.width === 0 || stageSize.height === 0) return 1;

    const horizontalInset = stageSize.width < 520 ? 32 : 96;
    const verticalInset = stageSize.height < 520 ? 72 : 112;
    const widthRatio = Math.max(stageSize.width - horizontalInset, 1) / imageSize.width;
    const heightRatio =
      Math.max(stageSize.height - verticalInset, 1) / imageSize.height;

    if (fitMode === "actual") return 1;
    if (fitMode === "width") return clamp(widthRatio, 0.05, 8);
    if (fitMode === "fit") {
      return clamp(Math.min(widthRatio, heightRatio, 1), 0.05, 8);
    }

    return zoom;
  }, [fitMode, imageSize, stageSize.height, stageSize.width, zoom]);

  useEffect(() => {
    if (fitMode !== "free") {
      useViewerStore.setState({ zoom: computedZoom, pan: { x: 0, y: 0 } });
    }
  }, [computedZoom, fitMode]);

  return (
    <div
      ref={stageRef}
      className={cn(
        "relative h-full touch-none overflow-hidden bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.005))]",
        isDragging && "cursor-grabbing",
      )}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        if (isInteractiveTarget(event.target)) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        dragStart.current = {
          x: event.clientX,
          y: event.clientY,
          panX: pan.x,
          panY: pan.y,
        };
        setIsDragging(true);
      }}
      onPointerMove={(event) => {
        if (!isDragging) return;
        setPan({
          x: dragStart.current.panX + event.clientX - dragStart.current.x,
          y: dragStart.current.panY + event.clientY - dragStart.current.y,
        });
      }}
      onPointerUp={(event) => {
        event.currentTarget.releasePointerCapture(event.pointerId);
        setIsDragging(false);
      }}
      onWheel={(event) => {
        event.preventDefault();
        const delta = event.deltaY > 0 ? 1 / 1.12 : 1.12;
        setZoom(zoom * delta);
      }}
    >
      <Button
        aria-label="Previous image"
        className="top-1/2 left-2 z-30 absolute -translate-y-1/2 bg-background/80 shadow-lg shadow-black/20 backdrop-blur sm:left-4"
        onClick={previous}
        size="icon"
        variant="outline"
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <Button
        aria-label="Next image"
        className="top-1/2 right-2 z-30 absolute -translate-y-1/2 bg-background/80 shadow-lg shadow-black/20 backdrop-blur sm:right-4"
        onClick={next}
        size="icon"
        variant="outline"
      >
        <ChevronRight aria-hidden="true" />
      </Button>

      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <img
          key={currentImage.path}
          alt={currentImage.name}
          className="max-w-none select-none shadow-2xl shadow-black/40 transition-opacity duration-200 will-change-transform"
          draggable={false}
          onError={() => showError(`Could not render '${currentImage.name}'.`)}
          onLoad={(event) => {
            setImageSize({
              width: event.currentTarget.naturalWidth || event.currentTarget.width,
              height:
                event.currentTarget.naturalHeight || event.currentTarget.height,
            });
          }}
          src={assetUrl(currentImage.path)}
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) rotate(${rotation}deg) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        />
      </div>

      <div className="absolute inset-0 z-20">
        <ImageHud currentImage={currentImage} />
      </div>
    </div>
  );
}
