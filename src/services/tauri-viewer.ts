import { convertFileSrc, invoke, isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Store } from "@tauri-apps/plugin-store";
import {
  defaultPreferences,
  useViewerStore,
} from "@/stores/viewer-store";
import {
  IMAGE_EXTENSIONS,
  type ImageCollection,
  type ViewerPreferences,
} from "@/types/viewer";

export function assetUrl(path: string) {
  return isTauri() ? convertFileSrc(path) : path;
}

export async function loadPreferences() {
  if (!isTauri()) return defaultPreferences;

  const store = await Store.load("settings.json", {
    defaults: defaultPreferences,
    autoSave: 150,
  });

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

export async function savePreference<K extends keyof ViewerPreferences>(
  key: K,
  value: ViewerPreferences[K],
) {
  if (!isTauri()) return;

  const store = await Store.load("settings.json", {
    defaults: defaultPreferences,
    autoSave: 150,
  });
  await store.set(key, value);
}

export async function loadCollection(paths: string[]) {
  const collection =
    paths.length === 1
      ? await invoke<ImageCollection>("load_path", { path: paths[0] })
      : await invoke<ImageCollection>("load_paths", { paths });

  useViewerStore.getState().setCollection(collection);

  const first = collection.images[collection.selectedIndex];
  if (first) {
    await savePreference("lastPath", first.path);
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
