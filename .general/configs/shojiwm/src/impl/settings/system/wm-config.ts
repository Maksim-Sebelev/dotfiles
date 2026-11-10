import type { WorkspaceGestureSpeedConfig } from "./window-manager";

/**
 * Which window switcher `Super+Tab` opens:
 * - `Flip3D` — a receding 3D stack (Vista-style, `flip-3d.tsx`)
 * - `Grid`   — a flat grid of every window (`window-grid.tsx`)
 */
export enum WindowSwitcherStyle {
  Flip3D,
  Grid,
}

/**
 * Behaviour knobs for `HybridWindowManager` that are not part of the
 * visual preset (they change how the WM reacts to input, not how it
 * looks). Read once in `init.ts` via `OutlookConfig.windowManager`.
 */
export interface WindowManagerConfig {
  /**
   * Three-finger swipe / wheel / kinetic-scroll tuning for tiled workspaces.
   * Passed straight to `HybridWindowManager.configureWorkspaceGestureSpeed`.
   * Omit to keep the WM's built-in defaults.
   */
  gestureSpeed?: WorkspaceGestureSpeedConfig;

  /**
   * When `Super+H` / `Super+L` (`focusTile(±1)`) is pressed and the active
   * tile sticks out of the screen on the side the focus key is heading,
   * the key pans that tile fully into view instead of advancing to the
   * neighbour. Moving on happens on the next press, once the window is
   * within the screen. Defaults to `true` (the upstream behaviour).
   *
   * Overflow on the opposite side never blocks: fixing it would scroll
   * against the pressed direction, so the key advances as usual.
   */
  focusPansIntoView?: boolean;

  /**
   * Which window switcher `Super+Tab` opens. Defaults to `Flip3D`.
   */
  windowSwitcher?: WindowSwitcherStyle;
}

export const DEFAULT_WM_CONFIG: Required<
  Pick<WindowManagerConfig, "focusPansIntoView">
> & WindowManagerConfig = {
  gestureSpeed: {
    workspaceScrollFactor: 1.5,
    workspaceScrollKineticFactor: 1,
    workspaceSwitchFactor: 1,
    workspaceSwitchVelocityFactor: 1,
    workspaceScrollSnapMaxVelocity: 600,
    workspaceScrollSnapBreakoutPx: 48,
  },
  focusPansIntoView: true,
  windowSwitcher: WindowSwitcherStyle.Flip3D, 
};
