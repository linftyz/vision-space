import { EmptyState } from "@/components/viewer/empty-state";
import { Filmstrip } from "@/components/viewer/filmstrip";
import { ImageStage } from "@/components/viewer/image-stage";
import { LoadStateOverlay } from "@/components/viewer/load-state-overlay";
import { TopBar } from "@/components/viewer/top-bar";
import { useViewerActions } from "@/hooks/use-viewer-actions";
import {
  useAppMenu,
  useDragAndDrop,
  useThemeSync,
  useViewerPreferences,
  useViewerShortcuts,
} from "@/hooks/use-viewer-effects";
import { useViewerStore } from "@/stores/viewer-store";

export function ViewerShell() {
  const collection = useViewerStore((state) => state.collection);
  const currentIndex = useViewerStore((state) => state.currentIndex);
  const currentImage = collection?.images[currentIndex] ?? null;
  const actions = useViewerActions();

  useViewerPreferences();
  useThemeSync();
  useDragAndDrop(actions.loadPaths);
  useAppMenu(actions);
  useViewerShortcuts(actions);

  return (
    <main className="isolate flex h-screen w-screen min-w-0 flex-col overflow-hidden bg-background text-foreground">
      <TopBar
        currentImage={currentImage}
        openFolder={actions.openFolder}
        openImage={actions.openImage}
        openRecentItem={actions.openRecentItem}
        setFitMode={actions.setFitMode}
        toggleFilmstrip={actions.toggleFilmstrip}
        zoomBy={actions.zoomBy}
      />

      <div className="relative min-h-0 min-w-0 flex-1 bg-[radial-gradient(circle_at_18%_10%,--alpha(var(--color-amber-400)/10%),transparent_26rem),linear-gradient(135deg,--alpha(var(--color-neutral-950)/96%),--alpha(var(--color-stone-950)/96%))] text-neutral-100">
        {currentImage ? (
          <ImageStage currentImage={currentImage} />
        ) : (
          <EmptyState
            openFolder={actions.openFolder}
            openImage={actions.openImage}
          />
        )}
        <LoadStateOverlay />
      </div>

      {collection && <Filmstrip />}
    </main>
  );
}
