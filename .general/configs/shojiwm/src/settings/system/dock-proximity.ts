// Dock proximity detection.
//
// Следит за курсором и сообщает, находится ли он в «зоне дока» —
// нижней полосе экрана. У бара это триггерит показ/скрытие дока.
//
// Две зоны с гистерезисом:
//   - SHOW: 10px от низа — чтобы док появился
//   - HIDE: 120px от низа — чтобы док скрылся (когда уже открыт)
// Это даёт точный триггер «дотянуться до дока», но не мигает,
// когда курсор на пару десятков пикселей выше тела дока.

import { COMPOSITOR } from "shoji_wm";

const DOCK_SHOW_ZONE_PX = 10;
const DOCK_HIDE_ZONE_PX = 120;

const dockProximityByMonitor = new Map<string, boolean>();

type BroadcastFn = (monitor: string, inside: boolean) => void;

let broadcast: BroadcastFn | null = null;

export function initDockProximity(broadcastFn: BroadcastFn): void {
  broadcast = broadcastFn;
}

function pointerInBottomStrip(
  monitor: string,
  pointerX: number,
  pointerY: number,
  stripPx: number,
): boolean {
  const output = COMPOSITOR.output.get(monitor);
  if (!output || !output.resolution) {
    return false;
  }
  const width = output.resolution.width / output.scale;
  const height = output.resolution.height / output.scale;
  const left = output.position.x;
  const top = output.position.y;
  const right = left + width;
  const bottom = top + height;
  return (
    pointerX >= left &&
    pointerX < right &&
    pointerY >= bottom - stripPx &&
    pointerY < bottom
  );
}

function nextDockProximity(
  monitor: string,
  pointerX: number,
  pointerY: number,
  onTrackedMonitor: boolean,
): boolean {
  if (!onTrackedMonitor) return false;
  const wasInside = dockProximityByMonitor.get(monitor) === true;
  // Пока снаружи — только узкая зона SHOW (10px).
  // Пока внутри — широкая зона HIDE (120px), чтобы док не мигал.
  return pointerInBottomStrip(
    monitor,
    pointerX,
    pointerY,
    wasInside ? DOCK_HIDE_ZONE_PX : DOCK_SHOW_ZONE_PX,
  );
}

function updateDockProximity(monitor: string, inside: boolean): void {
  if (dockProximityByMonitor.get(monitor) === inside) {
    return;
  }
  dockProximityByMonitor.set(monitor, inside);
  if (broadcast) {
    broadcast(monitor, inside);
  }
}

/**
 * Вызывается из обработчика onPointerMove. Обновляет proximity для
 * всех мониторов, но «активен» только тот, на котором сейчас курсор.
 *
 * @param pointerX глобальная X-координата курсора
 * @param pointerY глобальная Y-координата курсора
 * @param activeMonitor имя монитора, на котором сейчас курсор
 *                      (event.outputName), или undefined
 */
export function updateDockProximityForPointer(
  pointerX: number,
  pointerY: number,
  activeMonitor: string | undefined,
): void {
  for (const monitor of COMPOSITOR.output.list) {
    const inside = nextDockProximity(
      monitor,
      pointerX,
      pointerY,
      monitor === activeMonitor,
    );
    updateDockProximity(monitor, inside);
  }
}
