// Window requests: resize, move, maximize, minimize, fullscreen, activate.
//
// Обработчики запросов от клиентов (xdg-shell) и от композитора
// (перетаскивание, ресайз). Делегируются в HybridWindowManager.
//
// pointer.bindWindowMoveModifier / bindWindowResizeModifier определяют,
// с какой клавишей-модификатором зажатие мыши на окне превращается
// в перетаскивание/ресайз (Super).

import { COMPOSITOR } from "shoji_wm";
import type { HybridWindowManager } from "./window-manager";

export function initWindowRequests(
  wm: HybridWindowManager,
  scheduleBroadcast: () => void,
): void {
  COMPOSITOR.event.onWindowResize((event) => {
    wm.onWindowResize(event);
  });

  COMPOSITOR.pointer.bindWindowMoveModifier("Super");
  COMPOSITOR.pointer.bindWindowResizeModifier("Super");

  COMPOSITOR.event.onWindowMove((event) => {
    wm.onWindowMove(event);
  });

  COMPOSITOR.event.onWindowMaximizeRequest((event) => {
    wm.onWindowMaximizeRequest(event);
  });

  COMPOSITOR.event.onWindowMinimizeRequest((event) => {
    wm.onWindowMinimizeRequest(event);
  });

  COMPOSITOR.event.onWindowFullscreenRequest((event) => {
    wm.onWindowFullscreenRequest(event);
  });

  COMPOSITOR.event.onWindowActivateRequest((event) => {
    wm.onWindowActivateRequest(event);
    scheduleBroadcast();
  });
}
