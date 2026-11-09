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

export function makeScheduleWorkspaceBroadcast(
  wm: HybridWindowManager,
): () => void {
  return () => {
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

export function broadcastDockProximity(
  monitor: string,
  inside: boolean,
): void {
  WORKSPACE_IPC.broadcast("dock.proximity", { monitor, inside });
}

export function broadcastSnapPreview(preview: unknown): void {
  WORKSPACE_IPC.broadcast("snap.preview", preview);
}

export function closeIpc(): void {
  WORKSPACE_IPC.close();
}
