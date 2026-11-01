import { COMPOSITOR } from "shoji_wm";
import { initAll } from "./settings/init";
import {
  BackgroundAnimation,
} from "./settings/visual-effects/background-animation";
import {
  TerminalBackgroundAnimation,
} from "./settings/visual-effects/terminal-background-animation";
import {
  PopupAnimation,
} from "./settings/visual-effects/popup-animation";
import {
  Bar,
} from "./settings/visual-effects/bar";

initAll(
  {
    bar: Bar.ShojiBar2,
    background: BackgroundAnimation.Rain_2,
    terminalBackground: TerminalBackgroundAnimation.Rain_3,
    popup: PopupAnimation.Nothing,
  }
);

export default COMPOSITOR;
