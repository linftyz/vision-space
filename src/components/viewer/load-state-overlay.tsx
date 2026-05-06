import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useViewerStore } from "@/stores/viewer-store";

export function LoadStateOverlay() {
  const loadingMessage = useViewerStore((state) => state.loadingMessage);
  const loadError = useViewerStore((state) => state.loadError);
  const setLoadError = useViewerStore((state) => state.setLoadError);

  if (!loadingMessage && !loadError) return null;

  return (
    <div className="pointer-events-none absolute inset-x-3 top-3 z-30 flex justify-center sm:inset-x-4 sm:top-4">
      {loadingMessage ? (
        <div className="pointer-events-auto flex max-w-[min(28rem,100%)] items-center gap-2 rounded-lg border bg-background/88 px-3 py-2 text-sm shadow-xl shadow-black/25 backdrop-blur">
          <Spinner className="size-4 text-primary" />
          <span className="truncate text-muted-foreground">{loadingMessage}</span>
        </div>
      ) : (
        <Alert
          className="pointer-events-auto max-w-[min(34rem,100%)] bg-background/92 shadow-xl shadow-black/25 backdrop-blur"
          variant="error"
        >
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Could not open item</AlertTitle>
          <AlertDescription className="min-w-0">
            <span className="break-words">{loadError}</span>
          </AlertDescription>
          <div className="col-start-2 mt-2">
            <Button
              onClick={() => setLoadError(null)}
              size="xs"
              variant="outline"
            >
              Dismiss
            </Button>
          </div>
        </Alert>
      )}
    </div>
  );
}
