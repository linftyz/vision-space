export const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "bmp",
  "tif",
  "tiff",
  "avif",
  "svg",
] as const;

export type FitMode = "fit" | "actual" | "width" | "free";

export type SortMode =
  | "nameAsc"
  | "nameDesc"
  | "modifiedDesc"
  | "modifiedAsc"
  | "sizeDesc"
  | "sizeAsc";

export type ImageFile = {
  path: string;
  name: string;
  extension: string;
  size: number;
  modifiedMs?: number;
};

export type ImageCollection = {
  rootPath: string | null;
  images: ImageFile[];
  selectedIndex: number;
};

export type ImageMetadata = {
  cameraModel?: string | null;
  colorSpace?: string | null;
  dateTimeOriginal?: string | null;
  exposureTime?: string | null;
  fNumber?: string | null;
  focalLength?: string | null;
  iso?: string | null;
  lensModel?: string | null;
  orientation?: number | null;
  software?: string | null;
};

export type ViewerPreferences = {
  fitMode: Exclude<FitMode, "free">;
  sortMode: SortMode;
  themeAccent: ThemeAccent;
  themeMode: ThemeMode;
  showFilmstrip: boolean;
  lastPath?: string;
};

export type ViewerRecents = {
  recentFiles: RecentItem[];
  recentFolders: RecentItem[];
};

export type RecentItemKind = "file" | "folder";

export type RecentItem = {
  path: string;
  name: string;
  kind: RecentItemKind;
  openedAt: number;
};

export type ThemeMode = "system" | "light" | "dark";

export type ThemeAccent = "amber" | "cyan" | "rose" | "violet";
