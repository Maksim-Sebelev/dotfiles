import { COMPOSITOR } from "shoji_wm";

export function initSurfacePolicy(): void {
  COMPOSITOR.rendering.surfacePolicy = (surface) => {
    if (surface.kind === "popup" && surface.parentKind === "layer") {
      return { opaqueRegion: "ignore" };
    }
    return null;
  };
}
