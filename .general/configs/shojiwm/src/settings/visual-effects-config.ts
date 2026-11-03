import {
  BackgroundAnimation,
} from "./visual-effects/background-animation.ts";
import {
  TerminalBackgroundAnimation,
} from "./visual-effects/terminal-background-animation.ts";
import {
  PopupAnimation,
} from "./visual-effects/popup-animation.ts";
import {
  Bar,
} from "./visual-effects/bar.ts";

export interface OutlookConfig {
  bar: Bar;
  background: BackgroundAnimation;
  terminalBackground: TerminalBackgroundAnimation;
  popup: PopupAnimation;
}
