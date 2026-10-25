// Window manager instance + naturalRootRect + hot-reload state.
//
// initHybridWindowManager():
//   - создаёт HybridWindowManager с naturalRootRect;
//   - подписывается на COMPOSITOR.onDisable / onEnable для сохранения
//     и восстановления snapshot'а при hot reload;
//   - возвращает готовый инстанс.
//
// Возвращаемый WM используется другими модулями (ipc, window-events,
// window-requests, compositor-events, window-composition).

import {
  COMPOSITOR,
  type WaylandWindow,
  type ManagedWindowRect,
} from "shoji_wm";
import {
  HybridWindowManager,
  TITLEBAR_HEIGHT,
  WINDOW_BORDER_PX,
} from "./window-manager.ts";

const HOT_RELOAD_STATE_KEY = "config.hybrid-window-manager";

function naturalRootRect(window: WaylandWindow): ManagedWindowRect {
  const client = window.position;
  return {
    x: client.x - WINDOW_BORDER_PX,
    y: client.y - TITLEBAR_HEIGHT - WINDOW_BORDER_PX,
    width: client.width + WINDOW_BORDER_PX * 2,
    height: client.height + TITLEBAR_HEIGHT + WINDOW_BORDER_PX * 2,
  };
}

export function initHybridWindowManager(): HybridWindowManager {
  const wm = new HybridWindowManager(naturalRootRect);

  COMPOSITOR.onDisable((event) => {
    if (event.isReloading) {
      const snapshot = wm.snapshot();
      event.persist(HOT_RELOAD_STATE_KEY, snapshot);
    }
    wm.dispose();
  });

  COMPOSITOR.onEnable((event) => {
    if (event.isReloading) {
      const snapshot = event.restore<
        ReturnType<typeof HybridWindowManager.prototype.snapshot>
      >(HOT_RELOAD_STATE_KEY);
      if (snapshot) {
        wm.restore(snapshot);
      }
    }
  });

  return wm;
}
