import { COMPOSITOR } from "shoji_wm";
import {
  backgroundAnimation,
  BackgroundAnimation,
} from "./background-animation";
import {
  popupAnimation,
} from "./popup-animation";
import { type OutlookConfig } from "../visual-effects-config";

export function initEffectRouter(config: OutlookConfig): void {
  COMPOSITOR.effect.layer = (layer) => {
    const isBackground =
      layer.namespace()?.includes("background") ||
      layer.layer() === "background";

    if (isBackground) {
      if (config.background === BackgroundAnimation.Nothing) {
        return {};
      }
      return {
        replace: backgroundAnimation(
          layer.outputName(),
          config.background,
        ),
      };
    }
    return {};
  };

  COMPOSITOR.effect.popup = (popup) => {
    if (popup.parentKind === "window") {
      return {};
    }

    const effect = popupAnimation(config.popup);
    if (!effect) {
      return {};
    }

    return { behind: effect };
  };
}
