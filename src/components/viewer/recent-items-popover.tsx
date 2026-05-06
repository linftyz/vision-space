import { History, Trash2 } from "lucide-react";
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
  clearRecents,
  openFolder,
  openImage,
  openRecentItem,
}: {
  clearRecents: () => Promise<void>;
  openFolder: () => Promise<void>;
  openImage: () => Promise<void>;
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
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <PopoverTitle className="text-base">Recent</PopoverTitle>
              <PopoverDescription>
                Quickly reopen files and folders.
              </PopoverDescription>
            </div>
            <Button
              aria-label="Clear recent items"
              disabled={!hasRecentItems}
              onClick={() => void clearRecents()}
              size="icon-xs"
              variant="ghost"
            >
              <Trash2 aria-hidden="true" />
            </Button>
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
            <div className="grid gap-3 rounded-lg border bg-muted/40 p-3">
              <div className="text-muted-foreground text-xs">
                Recently opened files and folders will appear here.
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => void openImage()} size="sm">
                  Open Image
                </Button>
                <Button onClick={() => void openFolder()} size="sm" variant="outline">
                  Open Folder
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverPopup>
    </Popover>
  );
}
