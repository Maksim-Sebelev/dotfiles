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
 * looks). Read once in `init.ts` via `GlobalConfig.windowManager`.
 */
export interface WindowManagerConfig {
  gestureSpeed?: WorkspaceGestureSpeedConfig;
  focusPansIntoView?: boolean;
  /** Style for `Super+Tab`. Defaults to `Flip3D`. */
  windowSwitcher?: WindowSwitcherStyle;
  /** Style for the secondary switcher keybind. Defaults to `Grid`. */
  secondaryWindowSwitcher?: WindowSwitcherStyle;
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
  secondaryWindowSwitcher: WindowSwitcherStyle.Grid,
};
