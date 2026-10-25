// Snap-zone preview broadcaster.
//
// Сообщает бару активный snap-прямоугольник (floating edge zones или
// открытый tiling slot), чтобы бар отрисовал rounded preview overlay.
//
// Формат сообщения (broadcast канал "snap.preview"):
//   { monitor, rect: {x,y,w,h} | null, kind: "floating" | "tiling" }
//
// Дедупликация по JSON: broadcaster дёргается очень часто (на каждое
// движение мыши во время drag), но состояние меняется редко, поэтому
// сравниваем JSON и не шлём, если ничего не поменялось.

import type { HybridWindowManager } from "./window-manager";

let lastSnapJson = "";

type BroadcastFn = (preview: SnapPreviewBroadcaster) => void;

export function initSnapPreview(
  wm: HybridWindowManager,
  broadcastFn: BroadcastFn,
): void {
  wm.setSnapPreviewBroadcaster((preview) => {
    const json = JSON.stringify(preview);
    if (json === lastSnapJson) {
      return;
    }
    lastSnapJson = json;
    broadcastFn(preview);
  });
}
