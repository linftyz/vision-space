import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ImageHud } from "@/components/viewer/image-hud";
import { useElementSize } from "@/hooks/use-element-size";
import { useMediaQuery } from "@/hooks/use-media-query";
import { clamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import { showError } from "@/services/toasts";
import { assetUrl } from "@/services/tauri-viewer";
import { useViewerStore } from "@/stores/viewer-store";
import type { ImageFile } from "@/types/viewer";

type ImageLoadStatus = "loading" | "loaded" | "error";

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement
    ? Boolean(target.closest("button, a, input, textarea, select, [role='button']"))
    : false;
}

export function ImageStage({
  copyPath,
  currentImage,
  revealPath,
}: {
  copyPath: (path: string) => Promise<void>;
  currentImage: ImageFile;
  revealPath: (path: string) => Promise<void>;
}) {
  const [stageRef, stageSize] = useElementSize<HTMLDivElement>();
  const [isDragging, setIsDragging] = useState(false);
  const [imageStatus, setImageStatus] = useState<ImageLoadStatus>("loading");
  const [reloadToken, setReloadToken] = useState(0);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const isShortViewport = useMediaQuery("(max-height: 760px)");
  const isNarrowViewport = useMediaQuery({ max: 720 });

  const zoom = useViewerStore((state) => state.zoom);
  const fitMode = useViewerStore((state) => state.fitMode);
  const rotation = useViewerStore((state) => state.rotation);
  const pan = useViewerStore((state) => state.pan);
  const imageSize = useViewerStore((state) => state.imageSize);
  const collection = useViewerStore((state) => state.collection);
  const setPan = useViewerStore((state) => state.setPan);
  const setImageSize = useViewerStore((state) => state.setImageSize);
  const next = useViewerStore((state) => state.next);
  const previous = useViewerStore((state) => state.previous);
  const canNavigate = (collection?.images.length ?? 0) > 1;

  useEffect(() => {
    setImageStatus("loading");
    setReloadToken(0);
  }, [currentImage.path]);

  const computedZoom = useMemo(() => {
    if (!imageSize || stageSize.width === 0 || stageSize.height === 0) return 1;

    const horizontalInset = stageSize.width < 520 || isNarrowViewport ? 28 : 96;
    const verticalInset =
      stageSize.height < 520 || isShortViewport ? 64 : 112;
    const widthRatio = Math.max(stageSize.width - horizontalInset, 1) / imageSize.width;
    const heightRatio =
      Math.max(stageSize.height - verticalInset, 1) / imageSize.height;

    if (fitMode === "actual") return 1;
    if (fitMode === "width") return clamp(widthRatio, 0.05, 8);
    if (fitMode === "fit") {
      return clamp(Math.min(widthRatio, heightRatio, 1), 0.05, 8);
    }

    return zoom;
  }, [
    fitMode,
    imageSize,
    isNarrowViewport,
    isShortViewport,
    stageSize.height,
    stageSize.width,
    zoom,
  ]);

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
        const store = useViewerStore.getState();
        store.setZoom(store.zoom * delta);
      }}
    >
      {canNavigate ? (
        <>
          <Button
            aria-label="Previous image"
            className={cn(
              "absolute top-1/2 z-30 -translate-y-1/2 bg-background/80 shadow-lg shadow-black/20 backdrop-blur",
              isShortViewport || isNarrowViewport
                ? "left-2"
                : "left-2 sm:left-4",
            )}
            onClick={previous}
            size={isShortViewport || isNarrowViewport ? "icon-sm" : "icon"}
            variant="outline"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            aria-label="Next image"
            className={cn(
              "absolute top-1/2 z-30 -translate-y-1/2 bg-background/80 shadow-lg shadow-black/20 backdrop-blur",
              isShortViewport || isNarrowViewport
                ? "right-2"
                : "right-2 sm:right-4",
            )}
            onClick={next}
            size={isShortViewport || isNarrowViewport ? "icon-sm" : "icon"}
            variant="outline"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </>
      ) : null}

      <div className="absolute inset-0 z-0 flex items-center justify-center">
        {imageStatus === "loading" && (
          <div className="absolute z-10 flex items-center gap-2 rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-neutral-200 text-sm shadow-xl shadow-black/30 backdrop-blur">
            <Spinner className="size-4 text-primary" />
            <span>Loading image...</span>
          </div>
        )}
        {imageStatus === "error" && (
          <Alert className="absolute z-10 max-w-[min(28rem,calc(100%-2rem))] bg-background/90 text-foreground shadow-xl shadow-black/30 backdrop-blur" variant="error">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>Could not render image</AlertTitle>
            <AlertDescription>
              <span className="break-words">{currentImage.name}</span>
            </AlertDescription>
            <div className="col-start-2 mt-2 flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setImageStatus("loading");
                  setReloadToken((value) => value + 1);
                }}
                size="xs"
                variant="outline"
              >
                <RefreshCw aria-hidden="true" />
                Retry
              </Button>
              <Button onClick={next} size="xs" variant="outline">
                Next
              </Button>
            </div>
          </Alert>
        )}
        <img
          key={`${currentImage.path}-${reloadToken}`}
          alt={currentImage.name}
          className={cn(
            "max-w-none select-none shadow-2xl shadow-black/40 transition-opacity duration-200 will-change-transform",
            imageStatus !== "loaded" && "opacity-0",
          )}
          draggable={false}
          onError={() => {
            setImageStatus("error");
            showError(`Could not render '${currentImage.name}'.`);
          }}
          onLoad={(event) => {
            setImageStatus("loaded");
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
        <ImageHud
          copyPath={copyPath}
          currentImage={currentImage}
          revealPath={revealPath}
        />
      </div>
    </div>
  );
}
