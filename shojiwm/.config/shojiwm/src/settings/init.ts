import {
  COMPOSITOR,
} from "shoji_wm";

import { initHybridWindowManager } from "./system/window-manager-runtime.ts";
import { initPrimaryState } from "./system/startup.ts";
import { initBar } from "./visual-effects/bar.ts";
import { initEnvironment } from "./system/environment.ts";
import { initOutputs } from "./system/outputs.ts";
import { initSurfacePolicy } from "./system/surface-policy.ts";
import { initInput } from "./system/input.ts";
import { initCliphist } from "./system/cliphist.ts";
import { initBinds } from "./system/binds.ts";
import { initDockProximity } from "./system/dock-proximity.ts";
import { initSnapPreview } from "./system/snap-preview.ts";
import { initWindowEvents } from "./system/window-events.ts";
import { initWindowRequests } from "./system/window-requests.ts";
import { initCompositorEvents } from "./system/compositor-events.ts";
import { initDecoration } from "./system/decoration.ts";
import { initWindowComposition } from "./visual-effects/window-composition.tsx";
import { initEffectRouter } from "./visual-effects/effect-router.ts";
import { initLifecycle } from "./system/lifecycle.ts"
import {
  initIpc,
  broadcastDockProximity,
  broadcastSnapPreview,
} from "./system/ipc.ts";
import { type OutlookConfig } from "../visual-effects-config.ts";

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

  initPrimaryState(config);
  initBar(config);
  initCliphist();
  initBinds(wm, scheduleBroadcast);

  initInput(wm);
  initDecoration();

  // Visual effects
  initEffectRouter(config);
  initWindowComposition(wm, config);
}
