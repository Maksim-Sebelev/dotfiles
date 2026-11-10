import {
  BackgroundAnimation,
} from "./visual-effects/background-animation";
import {
  TerminalBackgroundAnimation,
} from "./visual-effects/terminal-background-animation";
import {
  PopupAnimation,
} from "./visual-effects/popup-animation";
import {
  Bar,
} from "./visual-effects/bar";
import type { WindowManagerConfig } from "./system/wm-config";

export interface OutlookConfig {
  bar: Bar;
  background: BackgroundAnimation;
  terminalBackground: TerminalBackgroundAnimation;
  popup: PopupAnimation;
  /**
   * Optional WM behaviour overrides (gesture speed, focus-pan behaviour).
   * Omitted fields fall back to `DEFAULT_WM_CONFIG` in `init.ts`.
   */
  windowManager?: WindowManagerConfig;
}
