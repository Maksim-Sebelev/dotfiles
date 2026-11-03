// Compositor-level events: gestures, output changes, layer create/update/destroy.
//
// Эти события не связаны с конкретным окном, но влияют на layout
// (usable area, workspace tiling). WM должен их знать, а бар — получать
// обновления через scheduleBroadcast.

import { COMPOSITOR } from "shoji_wm";
import type { HybridWindowManager } from "./window-manager";

export function initCompositorEvents(
  wm: HybridWindowManager,
  scheduleBroadcast: () => void,
): void {
  COMPOSITOR.event.onGestureSwipe((event) => {
    wm.onGestureSwipe(event);
    scheduleBroadcast();
  });

  COMPOSITOR.event.onOutputChange((event) => {
    wm.onOutputChange(event);
    scheduleBroadcast();
  });

  COMPOSITOR.event.onCreateLayer(() => {
    wm.refreshUsableAreaLayouts();
  });

  COMPOSITOR.event.onUpdateLayer(() => {
    wm.refreshUsableAreaLayouts();
  });

  COMPOSITOR.event.onDestroyLayer(() => {
    wm.refreshUsableAreaLayouts();
  });
}
