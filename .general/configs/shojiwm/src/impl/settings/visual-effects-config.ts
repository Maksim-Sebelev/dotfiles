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

export interface OutlookConfig {
  bar: Bar;
  background: BackgroundAnimation;
  terminalBackground: TerminalBackgroundAnimation;
  popup: PopupAnimation;
}
