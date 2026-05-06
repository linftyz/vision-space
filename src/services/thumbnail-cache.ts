import { assetUrl } from "@/services/tauri-viewer";

export type ThumbnailStatus = "loading" | "loaded" | "error";

const THUMBNAIL_CACHE_LIMIT = 800;

const thumbnailStatusCache = new Map<string, Exclude<ThumbnailStatus, "loading">>();
const thumbnailInflightCache = new Map<string, Promise<Exclude<ThumbnailStatus, "loading">>>();

export function getThumbnailStatus(path: string) {
  return thumbnailStatusCache.get(path);
}

export async function ensureThumbnail(path: string) {
  const cachedStatus = thumbnailStatusCache.get(path);
  if (cachedStatus) return cachedStatus;

  const inflight = thumbnailInflightCache.get(path);
  if (inflight) return inflight;

  const promise = new Promise<Exclude<ThumbnailStatus, "loading">>((resolve) => {
    const image = new window.Image();
    image.decoding = "async";
    image.onload = () => {
      updateThumbnailCache(path, "loaded");
      thumbnailInflightCache.delete(path);
      resolve("loaded");
    };
    image.onerror = () => {
      updateThumbnailCache(path, "error");
      thumbnailInflightCache.delete(path);
      resolve("error");
    };
    image.src = assetUrl(path);
  });

  thumbnailInflightCache.set(path, promise);
  return promise;
}

function updateThumbnailCache(
  path: string,
  status: Exclude<ThumbnailStatus, "loading">,
) {
  thumbnailStatusCache.delete(path);
  thumbnailStatusCache.set(path, status);

  if (thumbnailStatusCache.size <= THUMBNAIL_CACHE_LIMIT) return;

  const oldestKey = thumbnailStatusCache.keys().next().value;
  if (oldestKey) {
    thumbnailStatusCache.delete(oldestKey);
  }
}
