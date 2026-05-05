import { FolderOpen, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecentItem } from "@/types/viewer";

export function RecentGroup({
  items,
  label,
  openRecentItem,
}: {
  items: RecentItem[];
  label: string;
  openRecentItem: (item: RecentItem) => Promise<void>;
}) {
  if (items.length === 0) return null;

  return (
    <div className="grid gap-1">
      <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-normal">
        {label}
      </div>
      <div className="grid gap-1">
        {items.map((item) => (
          <RecentItemButton
            item={item}
            key={item.path}
            openRecentItem={openRecentItem}
          />
        ))}
      </div>
    </div>
  );
}

function RecentItemButton({
  item,
  openRecentItem,
}: {
  item: RecentItem;
  openRecentItem: (item: RecentItem) => Promise<void>;
}) {
  const Icon = item.kind === "file" ? ImageIcon : FolderOpen;

  return (
    <Button
      aria-label={`Open recent ${item.kind} ${item.name}`}
      className="h-auto w-full min-w-0 justify-start overflow-hidden whitespace-normal rounded-md px-2 py-1.5"
      onClick={() => void openRecentItem(item)}
      size="sm"
      title={item.path}
      variant="ghost"
    >
      <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-xs font-medium leading-4">
          {item.name}
        </span>
        <span className="block truncate text-[11px] leading-4 text-muted-foreground">
          {item.path}
        </span>
      </span>
    </Button>
  );
}
