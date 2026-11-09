import {
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
        shaderStage(loadShader("./src/impl/shaders/common/layer-blur-mask.frag"), {
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
        shaderStage(loadShader("./src/impl/shaders/common/layer-blur-mask.frag"), {
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
