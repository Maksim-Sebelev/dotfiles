import { COMPOSITOR } from "shoji_wm";
import type { HybridWindowManager } from "./window-manager";

export function initBinds(wm: HybridWindowManager, schedule: () => void) {

  // COMPOSITOR.pointer.bindWindowMoveModifier("Super");
  // COMPOSITOR.pointer.bindWindowResizeModifier("Super");

  COMPOSITOR.key.bind("terminal", "Super+Q", () => {
    COMPOSITOR.process.spawn({ command: ["kitty"] });
  });
  
  COMPOSITOR.key.bind("browser", "Super+B", () => {
    COMPOSITOR.process.spawn({ command: ["firefox"] });
  });
  
  COMPOSITOR.key.bind("discord", "Super+D", () => {
    COMPOSITOR.process.spawn({
      command:
        "discord --enable-features=UseOzonePlatform --ozone-platform=wayland --enable-wayland-ime --disable-gpu",
    });
  });
  
  COMPOSITOR.key.bind("dolphin", "Super+E", () => {
    COMPOSITOR.process.spawn({ command: "kitty yazi" });
  });
  
  COMPOSITOR.key.bind("mpc-toggle", "Alt+O", () => {
    COMPOSITOR.process.spawn({ 
      command: "mpc toggle" 
    });
  });
  
  COMPOSITOR.key.bind("mpc-prev", "Alt+U", () => {
    COMPOSITOR.process.spawn({ 
      command: "mpc prev" 
    });
  });
  
  COMPOSITOR.key.bind("mpc-next", "Alt+I", () => {
    COMPOSITOR.process.spawn({ 
      command: "mpc next" 
    });
  });
  
  COMPOSITOR.key.bind("screenshot-clipboard", "Print", () => {
    COMPOSITOR.process.spawn({
      command: "hyprshot -s -z -m region -m active --clipboard-only",
    });
  });
  
  COMPOSITOR.key.bind("screenshot-save", "Alt+Print", () => {
    COMPOSITOR.process.spawn({
      command: "hyprshot -s -z -m region -m active",
    });
  });
  
  COMPOSITOR.key.bind("record-screen", "Shift+Print", () => {
    // toggleRecording();
    COMPOSITOR.process.spawn({
      command: "record-screen",
    });
  });
  
  COMPOSITOR.key.bind("stop-record-screen", "Alt+S", () => {
    COMPOSITOR.process.spawn({
      command: "stop-screen-recording",
    });
    // toggleRecording();
  });
  
  function toggleStartMenu() {
    const monitor = wm.getCurrentMonitorName();
    COMPOSITOR.process.spawn({
      command: ["ags", "request", "-i", "ags", "start-menu", "toggle", monitor],
    });
  }
  COMPOSITOR.key.bind("start-menu", "Super+P", toggleStartMenu);
  
  COMPOSITOR.key.bind("clipboard", "Super+V", () => {
    const monitor = wm.getCurrentMonitorName();
    COMPOSITOR.process.spawn({
      command: ["ags", "request", "-i", "ags", "clipboard", "toggle", monitor],
    });
  });
  
  COMPOSITOR.key.bind("toggle-tiling-mode", "Super+S", () => {
    wm.toggleCurrentWorkspaceTiling();
    schedule();
  });
  COMPOSITOR.key.bind("close-focused-window", "Super+C", () => {
    wm.closeFocusedWindow();
  });
  COMPOSITOR.key.bind("toggle-focused-window-maximize", "Super+M", () => {
    wm.toggleFocusedWindowMaximize();
  });
  COMPOSITOR.key.bind("tile-focus-left", "Super+H", () => {
    wm.focusTile(-1);
  });
    COMPOSITOR.key.bind("tile-focus-right", "Super+L", () => {
    wm.focusTile(1);
  });
  
  COMPOSITOR.key.bind("tile-move-left", "Super+Shift+H", () => {
    wm.moveFocusedTile(-1);
    schedule();
  });
  COMPOSITOR.key.bind("tile-move-right", "Super+Shift+L", () => {
    wm.moveFocusedTile(1);
    schedule();
  });
  COMPOSITOR.key.bind("window-move-workspace-prev", "Super+Shift+K", () => {
    wm.moveFocusedWindowToNearWorkspace(-1);
    schedule();
  });
  COMPOSITOR.key.bind("window-move-workspace-next", "Super+Shift+J", () => {
    wm.moveFocusedWindowToNearWorkspace(1);
    schedule();
  });
  COMPOSITOR.key.bind("workspace-prev", "Super+K", () => {
    wm.switchWorkspace(-1);
    schedule();
  });
  COMPOSITOR.key.bind("workspace-next", "Super+J", () => {
    wm.switchWorkspace(1);
    schedule();
  });
  
  for (let i = 1; i <= 9; i++) {
    COMPOSITOR.key.bind(`workspace-switch-${i}`, `Super+${i}`, () => {
      const monitor = wm.getCurrentMonitorName();
      wm.switchWorkspaceTo(monitor, i);
      schedule();
    });
  }
  COMPOSITOR.key.bind("workspace-switch-10", "Super+0", () => {
    const monitor = wm.getCurrentMonitorName();
    wm.switchWorkspaceTo(monitor, 10);
    schedule();
  });

  for (let i = 1; i <= 9; i++) {
    COMPOSITOR.key.bind(`window-move-workspace-${i}`, `Super+Shift+${i}`, () => {
      const monitor = wm.getCurrentMonitorName();
      wm.switchWorkspaceTo(monitor, i);
      schedule();
      wm.moveFocusedWindowToWorkspace(i);
    });
  }
  COMPOSITOR.key.bind("window-move-workspace-10", "Super+Shift+0", () => {
    const monitor = wm.getCurrentMonitorName();
    wm.switchWorkspaceTo(monitor, 10);
    schedule();
    wm.moveFocusedWindowToWorkspace(10);
  });
  
  COMPOSITOR.key.bind("volume-up", "XF86AudioRaiseVolume", () => {
    COMPOSITOR.process.spawn({ command: "volume-up 5" });
  });
  COMPOSITOR.key.bind("volume-down", "xf86audiolowervolume", () => {
    COMPOSITOR.process.spawn({ command: "volume-down 5" });
  });
  COMPOSITOR.key.bind("volume-mute", "xf86audiomute", () => {
    COMPOSITOR.process.spawn({ command: "volume-toggle" });
  });
  COMPOSITOR.key.bind("microphone-mute", "XF86AudioMicMute", () => {
    COMPOSITOR.process.spawn({ command: "microphone-toggle" });
  });
  
  COMPOSITOR.key.bind("brightness-up", "XF86MonBrightnessUp", () => {
    COMPOSITOR.process.spawn({ command: "brightnessctl -q -n2 set 5%+" });
  });
  COMPOSITOR.key.bind("brightness-down", "XF86MonBrightnessDown", () => {
    COMPOSITOR.process.spawn({ command: "brightnessctl -q -n2 set 5%-" });
  });
  COMPOSITOR.key.bind("brightness-off", "Super+semicolon", () => {
    COMPOSITOR.process.spawn({ command: "brightnessctl -q set 0%" });
  });

  let fpsCounter = false;
  COMPOSITOR.key.bind("fps", "Super+Shift+F", () => {
    fpsCounter = !fpsCounter;
    COMPOSITOR.debug.fpsCounter = fpsCounter;
  });
  
  let profileEnabled = false;
  COMPOSITOR.key.bind("profile", "Super+Shift+T", () => {
    profileEnabled = !profileEnabled;
    COMPOSITOR.debug.enableProfile(profileEnabled);
  });
}
