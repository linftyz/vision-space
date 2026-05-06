import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatBytes,
  formatExifDate,
  formatModifiedDate,
  formatOrientation,
} from "@/lib/format";
import { useViewerStore } from "@/stores/viewer-store";
import type { ImageFile } from "@/types/viewer";

type InfoRowItem = {
  label: string;
  value: string | null;
};

function dirname(path: string) {
  const parts = path.split(/[\\/]/).filter(Boolean);
  if (parts.length <= 1) return path;
  return parts.slice(0, -1).join("/");
}

function compactInfoRows(rows: Array<InfoRowItem | null>) {
  return rows.filter((row): row is InfoRowItem => row !== null);
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
  const captureRows = imageMetadata
    ? compactInfoRows([
        imageMetadata.cameraModel
          ? { label: "Camera", value: imageMetadata.cameraModel }
          : null,
        imageMetadata.lensModel
          ? { label: "Lens", value: imageMetadata.lensModel }
          : null,
        imageMetadata.dateTimeOriginal
          ? {
              label: "Shot At",
              value: formatExifDate(imageMetadata.dateTimeOriginal),
            }
          : null,
        imageMetadata.exposureTime
          ? { label: "Exposure", value: imageMetadata.exposureTime }
          : null,
        imageMetadata.fNumber
          ? { label: "Aperture", value: imageMetadata.fNumber }
          : null,
        imageMetadata.iso ? { label: "ISO", value: imageMetadata.iso } : null,
        imageMetadata.focalLength
          ? { label: "Focal Length", value: imageMetadata.focalLength }
          : null,
        imageMetadata.orientation
          ? {
              label: "Orientation",
              value: formatOrientation(imageMetadata.orientation),
            }
          : null,
      ])
    : [];
  const processingRows = imageMetadata
    ? compactInfoRows([
        imageMetadata.colorSpace
          ? { label: "Color Space", value: imageMetadata.colorSpace }
          : null,
        imageMetadata.software
          ? { label: "Software", value: imageMetadata.software }
          : null,
      ])
    : [];

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
                  ? formatDimensions(imageSize.width, imageSize.height)
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
                {captureRows.length ? (
                  <InfoSection rows={captureRows} title="Capture" />
                ) : null}
                {processingRows.length ? (
                  <InfoSection rows={processingRows} title="Processing" />
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

function formatDimensions(width: number, height: number) {
  const megapixels = (width * height) / 1_000_000;
  const megapixelLabel =
    megapixels >= 10 ? megapixels.toFixed(1) : megapixels.toFixed(2);

  return `${width} x ${height} (${megapixelLabel} MP)`;
}

function InfoSection({
  rows,
  title,
}: {
  rows: InfoRowItem[];
  title: string;
}) {
  return (
    <section className="grid gap-2 rounded-lg border border-border/70 bg-muted/25 p-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {title}
      </div>
      <div className="grid gap-3">
        {rows.map((row) =>
          row.value ? (
            <InfoRow key={`${title}-${row.label}`} label={row.label} value={row.value} />
          ) : null,
        )}
      </div>
    </section>
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
