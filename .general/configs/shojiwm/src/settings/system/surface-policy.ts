// Surface rendering policy.
//
// GTK3 tooltips (waybar, бары) объявляют весь свой прямоугольник
// непрозрачным, несмотря на прозрачные скруглённые углы. Из-за этого
// композитор заливает углы сплошным цветом и отключает behind-blur.
// Для попапов, привязанных к слою (layer-shell), игнорируем декларацию
// opaque-region.

import { COMPOSITOR } from "shoji_wm";

export function initSurfacePolicy(): void {
  COMPOSITOR.rendering.surfacePolicy = (surface) => {
    if (surface.kind === "popup" && surface.parentKind === "layer") {
      return { opaqueRegion: "ignore" };
    }
    return null;
  };
}
