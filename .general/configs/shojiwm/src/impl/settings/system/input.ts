import { COMPOSITOR, type WaylandWindow } from "shoji_wm";
import type { HybridWindowManager } from "./window-manager";

export function initInput(wm: HybridWindowManager) {
  COMPOSITOR.input.configure((input, _context) => {
    input.global = {
      touchpad: {
        tapToClick: true,
        naturalScroll: true,
        scrollMethod: "twoFinger",
        disableWhileTyping: true,
        scrollFactor: 0.3,
      },
      pointer: {
        pointerAccel: 0.0,
        accelProfile: "flat",
      },
      keyboard: {
        options: "grp:win_space_toggle",
        layout: "us,ru",
        repeatRate: 25,
        repeatDelay: 250,
      },
      // trackball: {
      //   naturalScroll: true,
      //   scrollFactor: 0.3,
      // },
    };
  });

  wm.configureWorkspaceGestureSpeed({
    workspaceScrollFactor: 1.5,
    workspaceScrollKineticFactor: 1,
    workspaceSwitchFactor: 1,
    workspaceSwitchVelocityFactor: 1,
  });
}
