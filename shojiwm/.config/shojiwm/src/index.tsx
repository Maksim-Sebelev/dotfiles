import { COMPOSITOR } from "shoji_wm";
import { initAll } from "./settings/init.ts";
import {
  BackgroundAnimation,
} from "./settings/visual-effects/background-animation.ts";
import {
  TerminalBackgroundAnimation,
} from "./settings/visual-effects/terminal-background-animation.ts";
import {
  PopupAnimation,
} from "./settings/visual-effects/popup-animation.ts";
import {
  Bar,
} from "./settings/visual-effects/bar.ts";

initAll(
  {
    bar: Bar.ShojiBar2,
    background: BackgroundAnimation.Rain_2,
    terminalBackground: TerminalBackgroundAnimation.Rain_2,
    popup: PopupAnimation.Nothing,
  }
);

export default COMPOSITOR;
