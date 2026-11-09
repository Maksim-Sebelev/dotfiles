import { COMPOSITOR, type WaylandWindow } from "shoji_wm";
import type { HybridWindowManager } from "./window-manager";

const STARTUP_WORKSPACE_TARGETS = new Map<string, number>();
const MULTI_INSTANCE_QUEUES = new Map<string, number[]>();

function enqueueMultiInstance(matcher: string, workspaceIndex: number) {
  const queue = MULTI_INSTANCE_QUEUES.get(matcher) ?? [];
  queue.push(workspaceIndex);
  MULTI_INSTANCE_QUEUES.set(matcher, queue);
}

function launchOnWorkspace(
  processId: string,
  command: string | string[],
  workspaceIndex: number,
  appIdMatcher: string | string[],
  multiInstance = false,
) {
  const matchers = Array.isArray(appIdMatcher) ? appIdMatcher : [appIdMatcher];
  for (const matcher of matchers) {
    if (multiInstance) {
      enqueueMultiInstance(matcher, workspaceIndex);
    } else {
      STARTUP_WORKSPACE_TARGETS.set(matcher, workspaceIndex);
    }
  }
  COMPOSITOR.process.once(processId, {
    command: command,
    runPolicy: "once-per-session",
  });
}

export function initPrimaryState() {
  COMPOSITOR.process.once("fcitx5", {
    command: "fcitx5 -d",
    runPolicy: "once-per-session",
  });
  
  COMPOSITOR.process.once("mpdris2-rs.service", {
    command: "systemctl --user enable --now mpdris2-rs.service",
    runPolicy: "once-per-session",
  });
  
  launchOnWorkspace("Terminal-at-startup-1", "kitty", 1, "kitty", true);
  launchOnWorkspace("Terminal-at-startup-2", "kitty", 2, "kitty", true);
  launchOnWorkspace("firefox-at-start", "firefox", 3, "firefox");
  launchOnWorkspace("Telegram-at-start", "Telegram", 4, "telegram");
  launchOnWorkspace("ncmpcpp-at-start", "kitty ncmpcpp", 9, "kitty");
}

const MOVED_STARTUP_WINDOWS = new Set<string>();

export function maybeMoveStartupWindow(
    wm: HybridWindowManager,
    schedule: () => void,
    window: WaylandWindow
  ) {
  const id = window.id;
  if (MOVED_STARTUP_WINDOWS.has(id)) {
    return;
  }
  const appId = window.appId();
  if (!appId) {
    return;
  }
  const lower = appId.toLowerCase();

  for (const [matcher, queue] of MULTI_INSTANCE_QUEUES) {
    if (lower.includes(matcher) && queue.length > 0) {
      const target = queue.shift()!;
      MOVED_STARTUP_WINDOWS.add(id);
      wm.moveFocusedWindowToWorkspace(target);
      schedule();
      return;
    }
  }

  for (const [matcher, target] of STARTUP_WORKSPACE_TARGETS) {
    if (lower.includes(matcher)) {
      STARTUP_WORKSPACE_TARGETS.delete(matcher);
      MOVED_STARTUP_WINDOWS.add(id);
      wm.moveFocusedWindowToWorkspace(target);
      schedule();
      return;
    }
  }
}
