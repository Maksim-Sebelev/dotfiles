import { initHybridWindowManager } from "./system/window-manager-runtime";
import { initPrimaryState } from "./system/startup";
import { initBar } from "./visual-effects/bar";
import { initEnvironment } from "./system/environment";
import { initOutputs } from "./system/outputs";
import { initSurfacePolicy } from "./system/surface-policy";
import { initInput } from "./system/input";
import { initCliphist } from "./system/cliphist";
import { initBinds } from "./system/binds";
import { initDockProximity } from "./system/dock-proximity";
import { initSnapPreview } from "./system/snap-preview";
import { initWindowEvents } from "./system/window-events";
import { initWindowRequests } from "./system/window-requests";
import { initCompositorEvents } from "./system/compositor-events";
import { initDecoration } from "./system/decoration";
import {
  initWindowComposition,
  windowZIndex,
  titlebarButtonAt
} from "./visual-effects/window-composition";
import { initEffectRouter } from "./visual-effects/effect-router";
import { initLifecycle } from "./system/lifecycle"
import { createWindowSwitcherForConfig } from "./visual-effects/switcher";
import { WindowSwitcherStyle } from "./system/wm-config";
import type { WindowSwitcher } from "./visual-effects/window-switcher";
import {
  initIpc,
  broadcastDockProximity,
  broadcastSnapPreview,
} from "./system/ipc";
import { type OutlookConfig } from "./visual-effects-config";
import { DEFAULT_WM_CONFIG } from "./system/wm-config";

export function initAll(config: OutlookConfig): void {
  initLifecycle();

  initEnvironment();
  initOutputs();
  initSurfacePolicy();

  const wm = initHybridWindowManager();

  // WM behaviour: gesture speed (three-finger scroll/switch tuning) and
  // focus-pan behaviour. Per-preset via `OutlookConfig.windowManager`,
  // falling back to `DEFAULT_WM_CONFIG`.
  const wmConfig = { ...DEFAULT_WM_CONFIG, ...config.windowManager };
  if (wmConfig.gestureSpeed) {
    wm.configureWorkspaceGestureSpeed(wmConfig.gestureSpeed);
  }
  wm.setFocusPansIntoView(wmConfig.focusPansIntoView ?? true);

  // Window switcher (Super+Tab). Created here, passed to
  // initWindowComposition so the composition can render it.
  const windowSwitcher: WindowSwitcher = createWindowSwitcherForConfig(
    wmConfig.windowSwitcher ?? WindowSwitcherStyle.Flip3D,
    {
      windowManager: wm,
      stackOrder: (window) => windowZIndex(window, wm),
      titlebarButtonAt: (window, x, y) => titlebarButtonAt(window, x, y),
    },
  );

  const { scheduleBroadcast } = initIpc(wm);

  initDockProximity(broadcastDockProximity);
  initSnapPreview(wm, broadcastSnapPreview);
  initWindowEvents(wm, scheduleBroadcast);
  initWindowRequests(wm, scheduleBroadcast);
  initCompositorEvents(wm, scheduleBroadcast);

  initPrimaryState();
  initBar(config);
  initCliphist();
  initBinds(wm, scheduleBroadcast, windowSwitcher);

  initInput(wm);
  initDecoration();

  initEffectRouter(config);
  initWindowComposition(wm, config, windowSwitcher);
}
