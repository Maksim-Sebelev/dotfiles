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
import { initWindowComposition } from "./visual-effects/window-composition";
import { initEffectRouter } from "./visual-effects/effect-router";
import { initLifecycle } from "./system/lifecycle"
import {
  initIpc,
  broadcastDockProximity,
  broadcastSnapPreview,
} from "./system/ipc";
import { type OutlookConfig } from "./visual-effects-config";

export function initAll(config: OutlookConfig): void {
  initLifecycle();

  initEnvironment();
  initOutputs();
  initSurfacePolicy();

  const wm = initHybridWindowManager();

  const { scheduleBroadcast } = initIpc(wm);

  initDockProximity(broadcastDockProximity);
  initSnapPreview(wm, broadcastSnapPreview);
  initWindowEvents(wm, scheduleBroadcast);
  initWindowRequests(wm, scheduleBroadcast);
  initCompositorEvents(wm, scheduleBroadcast);

  initPrimaryState();
  initBar(config);
  initCliphist();
  initBinds(wm, scheduleBroadcast);

  initInput(wm);
  initDecoration();

  initEffectRouter(config);
  initWindowComposition(wm, config);
}
