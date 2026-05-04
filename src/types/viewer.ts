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

export type ViewerPreferences = {
  fitMode: Exclude<FitMode, "free">;
  themeAccent: ThemeAccent;
  themeMode: ThemeMode;
  showFilmstrip: boolean;
  lastPath?: string;
};

export type ThemeMode = "system" | "light" | "dark";

export type ThemeAccent = "amber" | "cyan" | "rose" | "violet";
