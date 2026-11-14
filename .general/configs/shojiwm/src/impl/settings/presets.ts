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
  ScreenLocker
} from "./system/startup"
import {
  type GlobalConfig
} from "./global-config"

// const AllowHardEffects = true;
const AllowHardEffects = false;

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
  Slavya_winter_3, // ^^^^^^^^^^^^^^^^^^^^^^^^
  Slavya_winter_4, // ^^^^^^^^^^^^^^^^^^^^^^^^
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

// choose your own, if u r not using my nixos setup with custom screenlocker
const screenLocker = ScreenLocker.custom;

export function getConfig(preset: Preset): GlobalConfig {
  switch (preset) {
    case Preset.Slavya_lake_rain_1:
      return {
        bar: Bar.ShojiBar2,
        background: BackgroundAnimation.Rain_2,
        terminalBackground: TerminalBackgroundAnimation.Rain_3,
        popup: PopupAnimation.Nothing,
        screenLocker: screenLocker,
      }

    case Preset.Slavya_winter_1:
      return {
        bar: Bar.ShojiBar2,
        background: AllowHardEffects ? BackgroundAnimation.Snow_with_blur_1 : BackgroundAnimation.Snow_with_blur_4,
        terminalBackground: TerminalBackgroundAnimation.Nothing,
        popup: PopupAnimation.Nothing,
        screenLocker: screenLocker,
      }

    case Preset.Slavya_winter_2:
      return {
        bar: Bar.ShojiBar2,
        background: AllowHardEffects ? BackgroundAnimation.Snow_without_blur_1 : BackgroundAnimation.Snow_without_blur_4,
        terminalBackground: TerminalBackgroundAnimation.Nothing,
        popup: PopupAnimation.Nothing,
        screenLocker: screenLocker,
      }

    case Preset.Slavya_winter_3:
      return getConfig(Preset.Slavya_winter_1);

    case Preset.Slavya_winter_4:
      return getConfig(Preset.Slavya_winter_2);

    case Preset.Ulya_winter_1:
      return {
        bar: Bar.ShojiBar2,
        background: AllowHardEffects ? BackgroundAnimation.Snow_with_blur_4 : BackgroundAnimation.Snow_with_blur_4,
        terminalBackground: TerminalBackgroundAnimation.Nothing,
        popup: PopupAnimation.Nothing,
        screenLocker: screenLocker,
      }

    case Preset.Ulya_winter_2:
      return {
        bar: Bar.ShojiBar2,
        background: AllowHardEffects ? BackgroundAnimation.Snow_without_blur_4 : BackgroundAnimation.Snow_without_blur_4,
        terminalBackground: TerminalBackgroundAnimation.Nothing,
        popup: PopupAnimation.Nothing,
        screenLocker: screenLocker,
      }

    case Preset.Ulya_summer_1:
      return {
        bar: Bar.ShojiBar2,
        background: BackgroundAnimation.Sunshine_2,
        terminalBackground: TerminalBackgroundAnimation.Nothing,
        popup: PopupAnimation.Nothing,
        screenLocker: screenLocker,
      }

    case Preset.Miku_from_bus_1:
      return {
        bar: Bar.ShojiBar2,
        background: BackgroundAnimation.Sunshine_1,
        terminalBackground: TerminalBackgroundAnimation.Nothing,
        popup: PopupAnimation.Nothing,
        screenLocker: screenLocker,
      }

    case Preset.Alisa_winter_1:
      return {
        bar: Bar.ShojiBar2,
        background: AllowHardEffects ? BackgroundAnimation.Snow_without_blur_2 : BackgroundAnimation.Snow_without_blur_4,
        terminalBackground: TerminalBackgroundAnimation.Nothing,
        popup: PopupAnimation.Nothing,
        screenLocker: screenLocker,
      }

    case Preset.RainyBubbles_1:
      return {
        bar: Bar.ShojiBar2,
        background: BackgroundAnimation.Bubbles,
        terminalBackground: TerminalBackgroundAnimation.Rain_1,
        popup: PopupAnimation.Nothing,
        screenLocker: screenLocker,
      }

    case Preset.PowerSaver:
      return {
        bar: Bar.ShojiBar2,
        background: BackgroundAnimation.Nothing,
        terminalBackground: TerminalBackgroundAnimation.Nothing,
        popup: PopupAnimation.Nothing,
        screenLocker: screenLocker,
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
    screenLocker: screenLocker,
  }
}

