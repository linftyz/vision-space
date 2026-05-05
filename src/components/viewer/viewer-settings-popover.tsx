import { Minus, Plus, RotateCw, Settings2, Space } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { savePreference } from "@/services/tauri-viewer";
import { useViewerStore } from "@/stores/viewer-store";
import type { FitMode, ThemeAccent, ThemeMode } from "@/types/viewer";

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

export function ViewerSettingsPopover({
  setFitMode,
  toggleFilmstrip,
  zoomBy,
}: {
  setFitMode: (fitMode: Exclude<FitMode, "free">) => void;
  toggleFilmstrip: (value: boolean) => void;
  zoomBy: (delta: number) => void;
}) {
  const fitMode = useViewerStore((state) => state.fitMode);
  const showFilmstrip = useViewerStore((state) => state.showFilmstrip);
  const themeAccent = useViewerStore((state) => state.themeAccent);
  const themeMode = useViewerStore((state) => state.themeMode);
  const zoom = useViewerStore((state) => state.zoom);
  const rotateClockwise = useViewerStore((state) => state.rotateClockwise);
  const setThemeAccent = useViewerStore((state) => state.setThemeAccent);
  const setThemeMode = useViewerStore((state) => state.setThemeMode);

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
  const updateZoom = (value: number | readonly number[]) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    useViewerStore.getState().setZoom(nextValue / 100);
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button aria-label="Viewer settings" size="icon" variant="ghost" />
        }
      >
        <Settings2 aria-hidden="true" />
      </PopoverTrigger>
      <PopoverPopup
        align="end"
        className="max-h-[calc(100vh-5rem)] w-[min(20rem,calc(100vw-1rem))] overflow-y-auto viewer-scrollbar"
      >
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
                onValueChange={updateZoom}
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
                onValueChange={updateZoom}
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
            <Button onClick={rotateClockwise} size="sm" variant="outline">
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
  );
}
