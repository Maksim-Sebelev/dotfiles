// Popup animations: blur behind popups (menus, tooltips).
//
// COMPOSITOR.effect.popup вызывается для каждого xdg_popup. Для попапов,
// привязанных к окну (parentKind === "window"), эффект не применяется —
// у окна может быть своя логика, и попап внутри окна не должен обрезаться
// размытием. Для попапов, привязанных к слою (bar, dock), рисуем blur
// за попапом.
//
// Структура — по образцу background-animation.ts:
//   - enum вариантов
//   - instances: Map<PopupAnimation, handle>  (по animation, без outputName —
//     popup-эффекты не привязаны к конкретному output'у)
//   - popupAnimation(animation) — фабрика, кэширует
//   - getPopupEffect(animation) — создаёт compilePopupEffect
//   - getPopupPipeline(animation) — switch, возвращает stages
//   - disposePopupAnimation() — dispose всех

import {
  COMPOSITOR,
  compilePopupEffect,
  backdropSource,
  dualKawaseBlur,
  shaderStage,
  loadShader,
  popupSource,
} from "shoji_wm";
import type { PopupEffectHandle } from "shoji_wm/types";

export enum PopupAnimation {
  Nothing,
  Blur,
  StrongBlur,
}

const instances = new Map<PopupAnimation, PopupEffectHandle>();

/**
 * Возвращает эффект для выбранной анимации попапа, или null если
 * анимация — Nothing (тогда COMPOSITOR.effect.popup не должен
 * возвращать behind/replace).
 */
export function popupAnimation(
  animation: PopupAnimation,
): PopupEffectHandle | null {
  if (animation === PopupAnimation.Nothing) {
    return null;
  }

  let effect = instances.get(animation);
  if (!effect) {
    effect = getPopupEffect(animation);
    instances.set(animation, effect);
  }
  return effect;
}

function getPopupEffect(animation: PopupAnimation): PopupEffectHandle {
  const pipeline = getPopupPipeline(animation);
  return compilePopupEffect({
    input: backdropSource(),
    capturePadding: 4 * 2 * 2 + 24 + 32,
    invalidate: { kind: "on-source-damage-box", damagePadding: 8 },
    // The mask stage intentionally outputs transparency (the blur is
    // clipped to the popup's own alpha), so the pipeline's alpha must
    // survive the finish/display passes instead of being forced opaque.
    alpha: "preserve",
    pipeline,
  });
}

function getPopupPipeline(animation: PopupAnimation) {
  switch (animation) {
    case PopupAnimation.Nothing:
      return [];

    case PopupAnimation.Blur:
      return [
        dualKawaseBlur({ radius: 4, passes: 2 }),
        shaderStage(loadShader("./shaders/common/layer-blur-mask.frag"), {
          textures: {
            layer_mask: popupSource(),
          },
          uniforms: {
            opacity_threshold: 0.25,
            mask_feather: 0.04,
          },
        }),
      ];

    case PopupAnimation.StrongBlur:
      return [
        dualKawaseBlur({ radius: 6, passes: 3 }),
        shaderStage(loadShader("./shaders/common/layer-blur-mask.frag"), {
          textures: {
            layer_mask: popupSource(),
          },
          uniforms: {
            opacity_threshold: 0.25,
            mask_feather: 0.04,
          },
        }),
      ];

    default:
      console.error(`No shader for popup animation ${animation}`);
      return [];
  }
}

// ---------------------------------------------------------------------------
// Dispose
// ---------------------------------------------------------------------------
export function disposePopupAnimation(): void {
  for (const effect of instances.values()) {
    effect.dispose?.();
  }
  instances.clear();
}
