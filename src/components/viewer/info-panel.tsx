import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes, formatModifiedDate } from "@/lib/format";
import { useViewerStore } from "@/stores/viewer-store";
import type { ImageFile } from "@/types/viewer";

function dirname(path: string) {
  const parts = path.split(/[\\/]/).filter(Boolean);
  if (parts.length <= 1) return path;
  return parts.slice(0, -1).join("/");
}

export function InfoPanel({
  copyPath,
  currentImage,
  revealPath,
}: {
  copyPath: (path: string) => Promise<void>;
  currentImage: ImageFile;
  revealPath: (path: string) => Promise<void>;
}) {
  const collection = useViewerStore((state) => state.collection);
  const currentIndex = useViewerStore((state) => state.currentIndex);
  const imageMetadata = useViewerStore((state) => state.imageMetadata);
  const imageMetadataStatus = useViewerStore((state) => state.imageMetadataStatus);
  const imageSize = useViewerStore((state) => state.imageSize);
  const showInfoPanel = useViewerStore((state) => state.showInfoPanel);
  const setShowInfoPanel = useViewerStore((state) => state.setShowInfoPanel);
  const modifiedDate = formatModifiedDate(currentImage.modifiedMs);

  if (!showInfoPanel) return null;

  return (
    <aside className="absolute right-2 bottom-2 left-2 z-30 flex max-h-[calc(100%-0.75rem)] min-h-0 flex-col overflow-hidden rounded-xl border bg-background/92 text-foreground shadow-2xl shadow-black/30 backdrop-blur sm:top-4 sm:right-4 sm:bottom-4 sm:left-auto sm:max-h-none sm:w-[min(24rem,42vw)]">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <div className="truncate font-medium text-sm">Image Info</div>
          <div className="mt-1 truncate text-muted-foreground text-xs">
            {currentImage.name}
          </div>
        </div>
        <Button
          aria-label="Close info panel"
          onClick={() => setShowInfoPanel(false)}
          size="icon-xs"
          variant="ghost"
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="grid gap-4 text-sm">
          <div className="grid gap-3">
            <InfoRow label="Name" value={currentImage.name} />
            <InfoRow label="Type" value={currentImage.extension.toUpperCase()} />
            <InfoRow
              label="Dimensions"
              value={
                imageSize
                  ? `${imageSize.width} x ${imageSize.height}`
                  : "Loading..."
              }
            />
            <InfoRow label="File Size" value={formatBytes(currentImage.size)} />
            <InfoRow label="Modified" value={modifiedDate ?? "Unknown"} />
            <InfoRow
              label="Position"
              value={
                collection
                  ? `${currentIndex + 1} of ${collection.images.length}`
                  : "Single image"
              }
            />
          </div>

          <div className="grid gap-2 border-t pt-4">
            <InfoBlock label="Folder" value={dirname(currentImage.path)} />
            <InfoBlock label="Path" value={currentImage.path} />
          </div>

          <div className="grid gap-3 border-t pt-4">
            <div className="font-medium text-sm">EXIF</div>
            {imageMetadataStatus === "loading" ? (
              <div className="text-muted-foreground text-sm">
                Loading metadata...
              </div>
            ) : imageMetadata ? (
              <div className="grid gap-3">
                {imageMetadata.cameraModel ? (
                  <InfoRow label="Camera" value={imageMetadata.cameraModel} />
                ) : null}
                {imageMetadata.lensModel ? (
                  <InfoRow label="Lens" value={imageMetadata.lensModel} />
                ) : null}
                {imageMetadata.dateTimeOriginal ? (
                  <InfoRow label="Shot At" value={imageMetadata.dateTimeOriginal} />
                ) : null}
                {imageMetadata.exposureTime ? (
                  <InfoRow label="Exposure" value={imageMetadata.exposureTime} />
                ) : null}
                {imageMetadata.fNumber ? (
                  <InfoRow label="Aperture" value={imageMetadata.fNumber} />
                ) : null}
                {imageMetadata.iso ? (
                  <InfoRow label="ISO" value={imageMetadata.iso} />
                ) : null}
                {imageMetadata.focalLength ? (
                  <InfoRow label="Focal Length" value={imageMetadata.focalLength} />
                ) : null}
                {imageMetadata.orientation ? (
                  <InfoRow
                    label="Orientation"
                    value={String(imageMetadata.orientation)}
                  />
                ) : null}
                {imageMetadata.software ? (
                  <InfoRow label="Software" value={imageMetadata.software} />
                ) : null}
                {imageMetadata.colorSpace ? (
                  <InfoRow label="Color Space" value={imageMetadata.colorSpace} />
                ) : null}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                No EXIF metadata was found for this image.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 border-t pt-4 sm:grid-cols-2">
            <Button onClick={() => void copyPath(currentImage.path)} size="sm">
              Copy Path
            </Button>
            <Button
              onClick={() => void revealPath(currentImage.path)}
              size="sm"
              variant="outline"
            >
              Show in Finder
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[5.75rem_minmax(0,1fr)] sm:items-start sm:gap-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="min-w-0 break-words text-sm leading-5 sm:text-right">
        {value}
      </span>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="break-words text-sm leading-5">{value}</div>
    </div>
  );
}
