import { COMPOSITOR } from "shoji_wm";
import { disposeTerminalBackgroundAnimation } from "../visual-effects/terminal-background-animation.tsx";
import { closeIpc } from "./ipc.ts";

const disposers: Array<() => void> = [];

export function onDispose(fn: () => void): void {
  disposers.push(fn);
}

export function initLifecycle(): void {
  onDispose(disposeTerminalBackgroundAnimation);
  onDispose(closeIpc);

  COMPOSITOR.onDisable(() => {
    for (const fn of disposers) {
      try {
        fn();
      } catch (e) {
        console.error("[lifecycle] dispose error:", e);
      }
    }
    disposers.length = 0;
  });
}
