import { type OutlookConfig } from "./visual-effects-config";
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
import {
  WindowSwitcherStyle  
} from "./system/wm-config"

// please add _n at the end of every enum,
// because of ability to add other versions
// of required preset
// maybe small difference in blur
// or int some shader's uniforms
export enum Preset {
  // Slavya
  Slavya_lake_rain_1,
  Slavya_winter_1, // for different wallpapers
  Slavya_winter_2, // ^^^^^^^^^^^^^^^^^^^^^^^^
  // Ulya
  Ulya_summer_1,
  Ulya_winter_1, // with blur
  Ulya_winter_2, // without blur
  // Lena
  Lena,
  // Alisa
  Alisa_winter_1,
  // Miky
  Miku_from_bus_1,
  // Other
  RainyBubbles_1,
  PowerSaver, // no effects
};

export function getConfig(preset: Preset): OutlookConfig {
  switch (preset) {
    case Preset.Slavya_lake_rain_1:
      return {
        bar: Bar.ShojiBar2,
        background: BackgroundAnimation.Rain_2,
        terminalBackground: TerminalBackgroundAnimation.Rain_3,
        popup: PopupAnimation.Nothing,
      }

    case Preset.Slavya_winter_1:
      return {
        bar: Bar.ShojiBar2,
        background: BackgroundAnimation.Snow_with_blur_1,
        terminalBackground: TerminalBackgroundAnimation.Nothing,
        popup: PopupAnimation.Nothing,
      }

    case Preset.Slavya_winter_2:
      return {
        bar: Bar.ShojiBar2,
        background: BackgroundAnimation.Snow_without_blur_1,
        terminalBackground: TerminalBackgroundAnimation.Nothing,
        popup: PopupAnimation.Nothing,
      }

    case Preset.Ulya_winter_1:
      return {
        bar: Bar.ShojiBar2,
        background: BackgroundAnimation.Snow_with_blur_3,
        terminalBackground: TerminalBackgroundAnimation.Nothing,
        popup: PopupAnimation.Nothing,
      }

    case Preset.Ulya_winter_2:
      return {
        bar: Bar.ShojiBar2,
        background: BackgroundAnimation.Snow_without_blur_3,
        terminalBackground: TerminalBackgroundAnimation.Nothing,
        popup: PopupAnimation.Nothing,
      }

    case Preset.Ulya_summer_1:
      return {
        bar: Bar.ShojiBar2,
        background: BackgroundAnimation.Sunshine_2,
        terminalBackground: TerminalBackgroundAnimation.Nothing,
        popup: PopupAnimation.Nothing,
      }

    case Preset.Miku_from_bus_1:
      return {
        bar: Bar.ShojiBar2,
        background: BackgroundAnimation.Sunshine_1,
        terminalBackground: TerminalBackgroundAnimation.Nothing,
        popup: PopupAnimation.Nothing,
      }

    case Preset.Alisa_winter_1:
      return {
        bar: Bar.ShojiBar2,
        background: BackgroundAnimation.Snow_without_blur_2,
        terminalBackground: TerminalBackgroundAnimation.Nothing,
        popup: PopupAnimation.Nothing,
      }

    case Preset.RainyBubbles_1:
      return {
        bar: Bar.ShojiBar2,
        background: BackgroundAnimation.Bubbles,
        terminalBackground: TerminalBackgroundAnimation.Rain_1,
        popup: PopupAnimation.Nothing,
      }

    case Preset.PowerSaver:
      return {
        bar: Bar.ShojiBar2,
        background: BackgroundAnimation.Nothing,
        terminalBackground: TerminalBackgroundAnimation.Nothing,
        popup: PopupAnimation.Nothing,
        windowManager: {
          focusPansIntoView: false,
          gestureSpeed: {
            workspaceScrollFactor: 1,
            workspaceScrollKineticFactor: 1,
            workspaceSwitchFactor: 1,
            workspaceSwitchVelocityFactor: 1,
            workspaceScrollSnapMaxVelocity: 300,
            workspaceScrollSnapBreakoutPx: 48,
          },
        },
      }

    default:
      console.error(`Undefined preset value`);
      break;
  }
  return {
    bar: Bar.ShojiBar2,
    background: BackgroundAnimation.Snow_with_blur_1,
    terminalBackground: TerminalBackgroundAnimation.Rain_3,
    popup: PopupAnimation.Nothing,
  }
}

