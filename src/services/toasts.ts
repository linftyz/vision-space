import { toastManager } from "@/components/ui/toast";

export function showError(error: unknown) {
  toastManager.add({
    title: "Could not load image",
    description: error instanceof Error ? error.message : String(error),
    type: "error",
  });
}

export function showInfo(title: string, description?: string) {
  toastManager.add({ title, description, type: "info" });
}
