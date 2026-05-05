import { convertFileSrc, invoke, isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Store } from "@tauri-apps/plugin-store";
import {
  defaultRecents,
  defaultPreferences,
  useViewerStore,
} from "@/stores/viewer-store";
import {
  IMAGE_EXTENSIONS,
  type ImageCollection,
  type RecentItem,
  type RecentItemKind,
  type ViewerPreferences,
  type ViewerRecents,
} from "@/types/viewer";

const RECENT_ITEM_LIMIT = 10;

export function assetUrl(path: string) {
  return isTauri() ? convertFileSrc(path) : path;
}

function basename(path: string) {
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

function recentPreferenceKey(kind: RecentItemKind) {
  return kind === "file" ? "recentFiles" : "recentFolders";
}

function normalizeRecentItems(
  items: unknown,
  kind: RecentItemKind,
): RecentItem[] {
  if (!Array.isArray(items)) return [];

  return items
    .filter(
      (item): item is RecentItem =>
        typeof item === "object" &&
        item !== null &&
        "path" in item &&
        "name" in item &&
        "kind" in item &&
        "openedAt" in item &&
        typeof item.path === "string" &&
        typeof item.name === "string" &&
        item.kind === kind &&
        typeof item.openedAt === "number",
    )
    .sort((a, b) => b.openedAt - a.openedAt)
    .slice(0, RECENT_ITEM_LIMIT);
}

async function loadSettingsStore() {
  return Store.load("settings.json", {
    defaults: defaultPreferences,
    autoSave: 150,
  });
}

async function loadRecentsStore() {
  return Store.load("recents.json", {
    defaults: defaultRecents,
    autoSave: 150,
  });
}

export async function loadPreferences() {
  if (!isTauri()) return defaultPreferences;

  const store = await loadSettingsStore();

  return {
    fitMode: (await store.get<ViewerPreferences["fitMode"]>("fitMode")) ?? "fit",
    themeAccent:
      (await store.get<ViewerPreferences["themeAccent"]>("themeAccent")) ??
      defaultPreferences.themeAccent,
    themeMode:
      (await store.get<ViewerPreferences["themeMode"]>("themeMode")) ??
      defaultPreferences.themeMode,
    showFilmstrip:
      (await store.get<boolean>("showFilmstrip")) ??
      defaultPreferences.showFilmstrip,
    lastPath: await store.get<string>("lastPath"),
  } satisfies ViewerPreferences;
}

export async function loadRecents() {
  if (!isTauri()) return defaultRecents;

  const store = await loadRecentsStore();

  return {
    recentFiles: normalizeRecentItems(await store.get("recentFiles"), "file"),
    recentFolders: normalizeRecentItems(
      await store.get("recentFolders"),
      "folder",
    ),
  } satisfies ViewerRecents;
}

export async function savePreference<K extends keyof ViewerPreferences>(
  key: K,
  value: ViewerPreferences[K],
) {
  if (!isTauri()) return;

  const store = await loadSettingsStore();
  await store.set(key, value);
}

export async function saveRecentItem(kind: RecentItemKind, path: string) {
  if (!isTauri()) return;

  const key = recentPreferenceKey(kind);
  const store = await loadRecentsStore();
  const currentItems = normalizeRecentItems(await store.get(key), kind);
  const nextItems = [
    { path, name: basename(path), kind, openedAt: Date.now() },
    ...currentItems.filter((item) => item.path !== path),
  ].slice(0, RECENT_ITEM_LIMIT);

  await store.set(key, nextItems);

  const { recentFiles, recentFolders, setRecentItems } =
    useViewerStore.getState();
  setRecentItems({
    recentFiles: kind === "file" ? nextItems : recentFiles,
    recentFolders: kind === "folder" ? nextItems : recentFolders,
  });
}

export async function removeRecentItem(kind: RecentItemKind, path: string) {
  if (!isTauri()) return;

  const key = recentPreferenceKey(kind);
  const store = await loadRecentsStore();
  const nextItems = normalizeRecentItems(await store.get(key), kind).filter(
    (item) => item.path !== path,
  );

  await store.set(key, nextItems);

  const { recentFiles, recentFolders, setRecentItems } =
    useViewerStore.getState();
  setRecentItems({
    recentFiles: kind === "file" ? nextItems : recentFiles,
    recentFolders: kind === "folder" ? nextItems : recentFolders,
  });
}

export async function loadCollection(
  paths: string[],
  recentItem?: Pick<RecentItem, "kind" | "path">,
) {
  const collection =
    paths.length === 1
      ? await invoke<ImageCollection>("load_path", { path: paths[0] })
      : await invoke<ImageCollection>("load_paths", { paths });

  useViewerStore.getState().setCollection(collection);

  const first = collection.images[collection.selectedIndex];
  if (first) {
    await savePreference("lastPath", first.path);
  }

  if (recentItem) {
    await saveRecentItem(recentItem.kind, recentItem.path);
  }

  return collection;
}

export async function openImageDialog() {
  const selected = await open({
    multiple: false,
    directory: false,
    title: "Open Image",
    filters: [{ name: "Images", extensions: [...IMAGE_EXTENSIONS] }],
  });

  return typeof selected === "string" ? selected : null;
}

export async function openFolderDialog() {
  const selected = await open({
    multiple: false,
    directory: true,
    title: "Open Image Folder",
  });

  return typeof selected === "string" ? selected : null;
}
