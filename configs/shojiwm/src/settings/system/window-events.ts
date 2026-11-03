// Window lifecycle events: open, first commit, close, focus.
//
// Обрабатывает события жизненного цикла окон и делегирует их
// HybridWindowManager. Дополнительно:
//   - onFirstCommit запускает maybeMoveStartupWindow (переносит окна,
//     запущенные при старте, на их целевые воркспейсы).
//   - scheduleBroadcast вызывается, чтобы бар получил актуальный
//     список окон/воркспейсов.

import { COMPOSITOR } from "shoji_wm";
import type { HybridWindowManager } from "./window-manager";
import { maybeMoveStartupWindow } from "./startup";

export function initWindowEvents(
  wm: HybridWindowManager,
  scheduleBroadcast: () => void,
): void {
  COMPOSITOR.event.onOpen((window) => {
    wm.onOpen(window);
  });

  COMPOSITOR.event.onInitialConfigure((window) => {
    wm.onInitialConfigure(window);
  });

  COMPOSITOR.event.onFirstCommit((window) => {
    wm.onFirstCommit(window);
    maybeMoveStartupWindow(wm, scheduleBroadcast, window);
    scheduleBroadcast();
  });

  COMPOSITOR.event.onStartClose((window) => {
    wm.onStartClose(window);
    scheduleBroadcast();
  });

  COMPOSITOR.event.onClose((window) => {
    wm.onClose(window);
    scheduleBroadcast();
  });

  COMPOSITOR.event.onFocus((window, focused) => {
    wm.onFocus(window, focused);
    if (focused) {
      wm.recordFocus(window.id);
      scheduleBroadcast();
    }
  });
}
