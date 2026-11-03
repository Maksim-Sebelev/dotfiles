// Размытие за панелями (барами, доками).
//
// LAYER_BLUR_MASK — layer-effect, который применяется к слоям, для которых
// не задан свой эффект. Размывает то, что за слоем, и обрезает размытие
// по альфе самого слоя (mask_feather), чтобы не залить прозрачные
// скруглённые углы.

import {
  compileLayerEffect,
  backdropSource,
  dualKawaseBlur,
  shaderStage,
  loadShader,
  layerSource,
} from "shoji_wm";

export const LAYER_BLUR_MASK = compileLayerEffect({
  input: backdropSource(),
  capturePadding: 24,
  invalidate: { kind: "on-source-damage-box", damagePadding: 8 },
  alpha: "preserve",
  pipeline: [
    dualKawaseBlur({ radius: 4, passes: 2 }),
    shaderStage(loadShader("./shaders/common/layer-blur-mask.frag"), {
      textures: {
        layer_mask: layerSource(),
      },
      uniforms: {
        opacity_threshold: 0.25,
        mask_feather: 0.04,
      },
    }),
  ],
});
