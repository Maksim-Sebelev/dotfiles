import type { HybridWindowManager, SnapPreviewBroadcaster } from "./window-manager";

let lastSnapJson = "";

type BroadcastFn = (preview: SnapPreviewBroadcaster) => void;

export function initSnapPreview(
  wm: HybridWindowManager,
  broadcastFn: BroadcastFn,
): void {
  wm.setSnapPreviewBroadcaster((preview) => {
    const json = JSON.stringify(preview);
    if (json === lastSnapJson) {
      return;
    }
    lastSnapJson = json;
    broadcastFn(preview);
  });
}
