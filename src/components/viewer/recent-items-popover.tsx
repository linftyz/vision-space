import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RecentGroup } from "@/components/viewer/recent-items";
import { useViewerStore } from "@/stores/viewer-store";
import type { RecentItem } from "@/types/viewer";

export function RecentItemsPopover({
  openRecentItem,
}: {
  openRecentItem: (item: RecentItem) => Promise<void>;
}) {
  const recentFiles = useViewerStore((state) => state.recentFiles);
  const recentFolders = useViewerStore((state) => state.recentFolders);
  const hasRecentItems = recentFiles.length > 0 || recentFolders.length > 0;

  return (
    <Popover>
      <PopoverTrigger
        render={<Button aria-label="Recent items" size="icon" variant="ghost" />}
      >
        <History aria-hidden="true" />
      </PopoverTrigger>
      <PopoverPopup
        align="end"
        className="max-h-[calc(100vh-5rem)] w-[min(22rem,calc(100vw-1rem))] overflow-y-auto viewer-scrollbar"
      >
        <div className="grid gap-4">
          <div>
            <PopoverTitle className="text-base">Recent</PopoverTitle>
            <PopoverDescription>
              Quickly reopen files and folders.
            </PopoverDescription>
          </div>

          {hasRecentItems ? (
            <div className="grid gap-3">
              <RecentGroup
                items={recentFiles}
                label="Files"
                openRecentItem={openRecentItem}
              />
              <RecentGroup
                items={recentFolders}
                label="Folders"
                openRecentItem={openRecentItem}
              />
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-muted-foreground text-xs">
              Recently opened files and folders will appear here.
            </div>
          )}
        </div>
      </PopoverPopup>
    </Popover>
  );
}
