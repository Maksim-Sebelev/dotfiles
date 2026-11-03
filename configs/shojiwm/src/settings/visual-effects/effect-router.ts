import { COMPOSITOR } from "shoji_wm";
import {
  backgroundAnimation,
  BackgroundAnimation,
} from "./background-animation.ts";
import {
  popupAnimation,
  PopupAnimation,
} from "./popup-animation.ts";
import { type OutlookConfig } from "../visual-effects-config.ts";

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

  // -------------------------------------------------------------------------
  // Popup effects: blur за меню и тултипами.
  // -------------------------------------------------------------------------
  COMPOSITOR.effect.popup = (popup) => {
    // Попапы, привязанные к окну, не трогаем: у окна может быть своя
    // логика, и попап внутри окна не должен обрезаться размытием.
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
