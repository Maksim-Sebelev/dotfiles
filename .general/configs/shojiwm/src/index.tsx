import { COMPOSITOR } from "shoji_wm";
import { initAll } from "./settings/init";
import { OutlookConfig } from "./settings/visual-effects-config";
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

enum Preset {
  Slavya_lake_rain,
  Ulya_winter_snow,
  Lena,
  Alisa,
  Miku_from_bus,
  TheOtherOne,
};

function applyOutlookPreset(preset: Preset): OutlookConfig {
  switch (preset) {
    case Preset.Slavya_lake_rain:
      return {
        bar: Bar.ShojiBar2,
        background: BackgroundAnimation.Rain_2,
        terminalBackground: TerminalBackgroundAnimation.Rain_3,
        popup: PopupAnimation.Nothing,
      }

    case Preset.Ulya_winter_snow:
      return {
        bar: Bar.ShojiBar2,
        background: BackgroundAnimation.Snow_1,
        terminalBackground: TerminalBackgroundAnimation.Nothing,
        popup: PopupAnimation.Nothing,
      }

    case Preset.Miku_from_bus:
      return {
        bar: Bar.ShojiBar2,
        background: BackgroundAnimation.Sunshine_1,
        terminalBackground: TerminalBackgroundAnimation.Nothing,
        popup: PopupAnimation.Nothing,
      }
    case Preset.TheOtherOne:
      return {
        bar: Bar.ShojiBar2,
        background: BackgroundAnimation.Snow_1,
        terminalBackground: TerminalBackgroundAnimation.LightBlur,
        popup: PopupAnimation.Nothing,
      }
    default:
      console.error(`Undefined preset value`);
      break;
  }
  return {
    bar: Bar.ShojiBar2,
    background: BackgroundAnimation.Snow_1,
    terminalBackground: TerminalBackgroundAnimation.Rain_3,
    popup: PopupAnimation.Nothing,
  }
}

initAll(applyOutlookPreset(Preset.TheOtherOne));

export default COMPOSITOR;
