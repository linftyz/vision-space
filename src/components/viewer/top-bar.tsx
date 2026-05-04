import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  Aperture,
  FolderOpen,
  Image as ImageIcon,
  Maximize2,
  Minus,
  Plus,
  RotateCw,
  Settings2,
  Space,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Popover,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TooltipButton } from "@/components/viewer/tooltip-button";
import { cn } from "@/lib/utils";
import { savePreference } from "@/services/tauri-viewer";
import { useViewerStore } from "@/stores/viewer-store";
import type { FitMode, ImageFile, ThemeAccent, ThemeMode } from "@/types/viewer";

const themeModes = [
  ["system", "System"],
  ["light", "Light"],
  ["dark", "Dark"],
] as const satisfies readonly [ThemeMode, string][];

const themeAccents = [
  ["amber", "Amber", "bg-[oklch(0.82_0.12_81)]"],
  ["cyan", "Cyan", "bg-[oklch(0.78_0.11_205)]"],
  ["rose", "Rose", "bg-[oklch(0.72_0.16_20)]"],
  ["violet", "Violet", "bg-[oklch(0.72_0.14_305)]"],
] as const satisfies readonly [ThemeAccent, string, string][];

export function TopBar({
  currentImage,
  openFolder,
  openImage,
  setFitMode,
  toggleFilmstrip,
  zoomBy,
}: {
  currentImage: ImageFile | null;
  openFolder: () => Promise<void>;
  openImage: () => Promise<void>;
  setFitMode: (fitMode: Exclude<FitMode, "free">) => void;
  toggleFilmstrip: (value: boolean) => void;
  zoomBy: (delta: number) => void;
}) {
  const collection = useViewerStore((state) => state.collection);
  const currentIndex = useViewerStore((state) => state.currentIndex);
  const fitMode = useViewerStore((state) => state.fitMode);
  const showFilmstrip = useViewerStore((state) => state.showFilmstrip);
  const themeAccent = useViewerStore((state) => state.themeAccent);
  const themeMode = useViewerStore((state) => state.themeMode);
  const zoom = useViewerStore((state) => state.zoom);
  const rotation = useViewerStore((state) => state.rotation);
  const setRotation = useViewerStore((state) => state.setRotation);
  const setThemeAccent = useViewerStore((state) => state.setThemeAccent);
  const setThemeMode = useViewerStore((state) => state.setThemeMode);
  const imageCount = collection?.images.length ?? 0;
  const updateThemeMode = (value: string[]) => {
    const nextThemeMode = value[0] as ThemeMode | undefined;
    if (!nextThemeMode || !themeModes.some(([mode]) => mode === nextThemeMode)) {
      return;
    }
    setThemeMode(nextThemeMode);
    void savePreference("themeMode", nextThemeMode);
  };
  const updateThemeAccent = (value: string[]) => {
    const nextThemeAccent = value[0] as ThemeAccent | undefined;
    if (
      !nextThemeAccent ||
      !themeAccents.some(([accent]) => accent === nextThemeAccent)
    ) {
      return;
    }
    setThemeAccent(nextThemeAccent);
    void savePreference("themeAccent", nextThemeAccent);
  };

  return (
    <header className="z-20 flex min-h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/82 px-2.5 py-2 text-foreground shadow-2xl shadow-black/20 backdrop-blur-xl sm:gap-3 sm:px-3">
      <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-primary text-primary-foreground shadow-sm sm:size-8">
          <Aperture aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="truncate font-heading font-semibold text-sm">
            {currentImage?.name ?? "Vision Space"}
          </div>
          <div className="truncate text-muted-foreground text-xs leading-4">
            {collection
              ? `${currentIndex + 1} of ${imageCount}`
              : "A quiet native image viewer"}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5">
        <TooltipButton
          label="Open image"
          onClick={() => void openImage()}
          shortcut="⌘O"
        >
          <ImageIcon aria-hidden="true" />
        </TooltipButton>
        <TooltipButton
          label="Open folder"
          onClick={() => void openFolder()}
          shortcut="⇧⌘O"
        >
          <FolderOpen aria-hidden="true" />
        </TooltipButton>

        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

        <TooltipButton
          className="hidden sm:block"
          label="Zoom out"
          onClick={() => zoomBy(1 / 1.18)}
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
        >
          <Plus aria-hidden="true" />
        </TooltipButton>
        <TooltipButton
          className="hidden md:block"
          label="Fit to window"
          onClick={() => setFitMode("fit")}
        >
          <Space aria-hidden="true" />
        </TooltipButton>
        <TooltipButton
          className="hidden md:block"
          label="Rotate clockwise"
          onClick={() => setRotation(rotation + 90)}
        >
          <RotateCw aria-hidden="true" />
        </TooltipButton>

        <Popover>
          <PopoverTrigger
            render={
              <Button aria-label="Viewer settings" size="icon" variant="ghost" />
            }
          >
            <Settings2 aria-hidden="true" />
          </PopoverTrigger>
          <PopoverPopup align="end" className="w-[min(21rem,calc(100vw-1rem))]">
            <div className="flex flex-col gap-5">
              <div>
                <PopoverTitle className="text-base">Viewer</PopoverTitle>
                <PopoverDescription>
                  Display preferences for this workspace.
                </PopoverDescription>
              </div>
              <div className="flex flex-col gap-3 sm:hidden">
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => zoomBy(1 / 1.18)} size="sm" variant="outline">
                    <Minus aria-hidden="true" />
                    Zoom
                  </Button>
                  <Button onClick={() => zoomBy(1.18)} size="sm" variant="outline">
                    <Plus aria-hidden="true" />
                    Zoom
                  </Button>
                </div>
                <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2">
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
                  <span className="w-11 text-right text-muted-foreground text-xs tabular-nums">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
              </div>
              <div className="hidden flex-col gap-3 sm:flex lg:hidden">
                <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2">
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
                  <span className="w-11 text-right text-muted-foreground text-xs tabular-nums">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 md:hidden">
                <Button onClick={() => setFitMode("fit")} size="sm" variant="outline">
                  <Space aria-hidden="true" />
                  Fit
                </Button>
                <Button
                  onClick={() => setRotation(rotation + 90)}
                  size="sm"
                  variant="outline"
                >
                  <RotateCw aria-hidden="true" />
                  Rotate
                </Button>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-sm">Filmstrip</div>
                  <div className="text-muted-foreground text-xs">
                    Show thumbnails along the bottom.
                  </div>
                </div>
                <Switch
                  aria-label="Show filmstrip"
                  checked={showFilmstrip}
                  onCheckedChange={toggleFilmstrip}
                />
              </div>
              <div className="flex flex-col gap-2">
                <div>
                  <div className="font-medium text-sm">Appearance</div>
                  <div className="text-muted-foreground text-xs">
                    Follow the system, or pin a theme.
                  </div>
                </div>
                <ToggleGroup
                  aria-label="Theme mode"
                  className="grid w-full grid-cols-3"
                  onValueChange={updateThemeMode}
                  value={[themeMode]}
                  variant="outline"
                >
                  {themeModes.map(([mode, label]) => (
                    <ToggleGroupItem
                      aria-label={`Use ${label.toLowerCase()} theme`}
                      className="w-full"
                      key={mode}
                      value={mode}
                    >
                      {label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-sm">Accent</div>
                  <div className="text-muted-foreground text-xs">
                    Used for focus and primary controls.
                  </div>
                </div>
                <ToggleGroup
                  aria-label="Accent color"
                  className="gap-1"
                  onValueChange={updateThemeAccent}
                  value={[themeAccent]}
                >
                  {themeAccents.map(([accent, label, swatchClass]) => (
                    <ToggleGroupItem
                      aria-label={`Use ${label} accent`}
                      className="size-7 rounded-full p-0"
                      key={accent}
                      value={accent}
                    >
                      <span
                        className={cn(
                          "size-4 rounded-full border border-white/40",
                          swatchClass,
                        )}
                      />
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[
                  ["fit", "Fit"],
                  ["actual", "1:1"],
                  ["width", "Width"],
                ].map(([mode, label]) => (
                  <Button
                    key={mode}
                    onClick={() => setFitMode(mode as Exclude<FitMode, "free">)}
                    size="sm"
                    variant={fitMode === mode ? "default" : "outline"}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <div className="grid gap-2 rounded-lg border bg-muted/40 p-3 text-muted-foreground text-xs">
                <div className="flex items-center justify-between">
                  <span>Next / Previous</span>
                  <span className="flex gap-1">
                    <Kbd>←</Kbd>
                    <Kbd>→</Kbd>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fit to window</span>
                  <Kbd>Space</Kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Actual size</span>
                  <Kbd>0</Kbd>
                </div>
              </div>
            </div>
          </PopoverPopup>
        </Popover>

        <TooltipButton
          className="hidden sm:block"
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
        >
          <Maximize2 aria-hidden="true" />
        </TooltipButton>
      </div>
    </header>
  );
}
