import type { WaylandWindow } from "shoji_wm";
import {
  WindowSwitcherStyle,
  type WindowManagerConfig,
} from "../system/wm-config";
import type { HybridWindowManager } from "../system/window-manager";
import {
  createFlip3D,
} from "./flip-3d"
import {
  type WindowSwitcher,
  type WindowSwitcherOptions,
  type TitlebarButton,
} from "./window-switcher";
import { createWindowGrid } from "./window-grid";

export interface CreateWindowSwitcherOptions {
  windowManager: HybridWindowManager;
  /**
   * A window's place in the real stack, higher on top (its decoration's
   * zIndex). Provided by `window-composition.ts` (it owns `windowZIndex`).
   */
  stackOrder: (window: WaylandWindow) => number;
  /**
   * The title bar button at `(x, y)`: logical px from `window.rect`'s
   * top-left corner. Provided by `window-composition.ts`.
   */
  titlebarButtonAt?: (window: WaylandWindow, x: number, y: number) => TitlebarButton | null;
}

/**
 * Create the window switcher (`Super+Tab`) for the given style.
 *
 * `Flip3D` — a receding 3D stack (Vista-style).
 * `Grid`   — a flat grid of every window.
 *
 * Named `...ForConfig` to distinguish it from `createWindowSwitcher` in
 * `./window-switcher.tsx`, which is the shared core both layouts use.
 */
export function createWindowSwitcherForConfig(
  style: WindowSwitcherStyle,
  options: CreateWindowSwitcherOptions,
): WindowSwitcher {
  const switcherOptions: WindowSwitcherOptions = {
    windowManager: options.windowManager,
    stackOrder: options.stackOrder,
    titlebarButtonAt: options.titlebarButtonAt,
  };
  return style === WindowSwitcherStyle.Grid
    ? createWindowGrid(switcherOptions)
    : createFlip3D(switcherOptions);
}
