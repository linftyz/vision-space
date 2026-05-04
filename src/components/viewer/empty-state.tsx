import { Aperture, FolderOpen, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function EmptyState({
  openFolder,
  openImage,
}: {
  openFolder: () => Promise<void>;
  openImage: () => Promise<void>;
}) {
  return (
    <section className="flex h-full items-center justify-center px-4 py-8 sm:px-6">
      <div className="flex max-w-xl flex-col items-center gap-5 text-center sm:gap-6">
        <div className="relative flex size-20 items-center justify-center rounded-full border bg-background shadow-2xl shadow-black/35 sm:size-24">
          <Aperture aria-hidden="true" className="text-primary" />
          <div className="-right-2 -bottom-1 absolute rounded-md border bg-popover px-2 py-1 text-muted-foreground text-[11px] sm:text-xs">
            SVG ready
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-balance font-heading font-semibold text-2xl tracking-normal sm:text-3xl">
            Drop an image into the darkroom.
          </h1>
          <p className="max-w-md text-pretty text-muted-foreground text-sm leading-6">
            Open one file to browse its folder, or open a folder to move through
            a clean local contact sheet.
          </p>
        </div>
        <div className="grid w-full max-w-xs grid-cols-1 gap-2 sm:max-w-none sm:grid-cols-2">
          <Button className="w-full" onClick={() => void openImage()}>
            <ImageIcon aria-hidden="true" />
            Open Image
          </Button>
          <Button className="w-full" onClick={() => void openFolder()} variant="outline">
            <FolderOpen aria-hidden="true" />
            Open Folder
          </Button>
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-muted-foreground text-xs">
          <Badge variant="outline">JPG</Badge>
          <Badge variant="outline">PNG</Badge>
          <Badge variant="outline">WebP</Badge>
          <Badge variant="outline">AVIF</Badge>
          <Badge variant="outline">SVG</Badge>
        </div>
      </div>
    </section>
  );
}
