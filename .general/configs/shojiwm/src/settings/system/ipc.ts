// External IPC: expose the workspace layout to clients such as the bar.
//
//   workspaces.get           -> WorkspacesView                     (request/response)
//   workspaces.switch        { direction: -1 | 1 }                 (command)
//   workspaces.activate      { monitor: string, index: number }    (command)
//   workspaces.toggleTiling  { monitor?: string }                  (command)
//   workspaces.changed       -> WorkspacesView                     (broadcast)
//   windows.activate         { windowId: string }                  (command)
//   dock.proximity           { monitor: string, inside: bool }     (broadcast)
//   snap.preview             { monitor, rect, kind }               (broadcast)

import { COMPOSITOR } from "shoji_wm";
import { createIpcServer } from "shoji_wm/ipc";
import type { HybridWindowManager } from "./window-manager";

const WORKSPACE_IPC = createIpcServer();

let lastWorkspacesJson = "";
let workspaceBroadcastQueued = false;

function broadcastWorkspaces(wm: HybridWindowManager): void {
  const view = wm.viewForIpc();
  const json = JSON.stringify(view);
  if (json === lastWorkspacesJson) {
    return;
  }
  lastWorkspacesJson = json;
  WORKSPACE_IPC.broadcast("workspaces.changed", view);
}

function reconfigureProtocolWorkspaces(): void {
  COMPOSITOR.workspace.reconfigure();
}

/**
 * Coalesce many state mutations within one tick into a single diffed broadcast.
 *
 * Каждое workspace-level изменение (переключение, скролл, tiling, окна
 * появляются/уходят) проходит через эту функцию — это единственная точка,
 * где нужно будить симуляцию (воду/чернила), если она есть.
 */
export function makeScheduleWorkspaceBroadcast(
  wm: HybridWindowManager,
): () => void {
  return () => {
    // waterWake(); // если вернёшь воду
    // Протокол workspace state должен быть staged до того, как текущий
    // runtime-ответ будет записан; иначе бинды/Waybar-активации достигнут
    // бара только на следующем запросе.
    reconfigureProtocolWorkspaces();
    if (workspaceBroadcastQueued) {
      return;
    }
    workspaceBroadcastQueued = true;
    void Promise.resolve().then(() => {
      workspaceBroadcastQueued = false;
      broadcastWorkspaces(wm);
    });
  };
}

export function initIpc(wm: HybridWindowManager): {
  scheduleBroadcast: () => void;
} {
  const scheduleBroadcast = makeScheduleWorkspaceBroadcast(wm);

  COMPOSITOR.workspace.configure(() => {
    const view = wm.viewForIpc();
    return {
      groups: view.monitors.map((monitor) => ({
        id: monitor.name,
        outputs: [monitor.name],
        workspaces: monitor.workspaces.map((workspace) => ({
          id: `${monitor.name}:${workspace.index}`,
          name: String(workspace.index),
          coordinates: [Math.max(0, workspace.index - 1)],
          active: workspace.active,
          hidden: !workspace.active && workspace.windowCount === 0,
        })),
      })),
    };
  });

  COMPOSITOR.workspace.event.onActivate((event) => {
    const [monitor, rawIndex] = event.workspaceId.split(":");
    const index = Number(rawIndex);
    if (!monitor || !Number.isInteger(index) || index < 1) {
      return;
    }
    wm.activate(monitor, index);
    scheduleBroadcast();
    wm.setWorkspaceChangeBroadcaster(() => {
      scheduleBroadcast();
    });
  });

  WORKSPACE_IPC.handle("workspaces.get", () => wm.viewForIpc());

  WORKSPACE_IPC.handle("workspaces.switch", (params) => {
    const direction = (params as { direction?: number } | undefined)?.direction;
    wm.switchWorkspace(direction === -1 ? -1 : 1);
    scheduleBroadcast();
  });

  WORKSPACE_IPC.handle("workspaces.activate", (params) => {
    const request = params as { monitor?: string; index?: number } | undefined;
    if (request?.monitor && typeof request.index === "number") {
      wm.activate(request.monitor, request.index);
      scheduleBroadcast();
    }
  });

  WORKSPACE_IPC.handle("workspaces.toggleTiling", (params) => {
    const monitor = (params as { monitor?: string } | undefined)?.monitor;
    if (monitor) {
      wm.toggleWorkspaceTilingForMonitor(monitor);
    } else {
      wm.toggleCurrentWorkspaceTiling();
    }
    scheduleBroadcast();
  });

  WORKSPACE_IPC.handle("windows.activate", (params) => {
    const windowId = (params as { windowId?: string } | undefined)?.windowId;
    if (typeof windowId === "string") {
      wm.activateWindowById(windowId);
      scheduleBroadcast();
    }
  });

  return { scheduleBroadcast };
}

/** Broadcast dock proximity change to the bar. */
export function broadcastDockProximity(
  monitor: string,
  inside: boolean,
): void {
  WORKSPACE_IPC.broadcast("dock.proximity", { monitor, inside });
}

/** Broadcast snap preview change to the bar. */
export function broadcastSnapPreview(preview: unknown): void {
  WORKSPACE_IPC.broadcast("snap.preview", preview);
}

/** Close IPC server. Вызывается из COMPOSITOR.onDisable. */
export function closeIpc(): void {
  WORKSPACE_IPC.close();
}
