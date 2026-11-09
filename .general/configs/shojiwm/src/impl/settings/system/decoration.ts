import { COMPOSITOR } from "shoji_wm";

export function initDecoration(): void {
  COMPOSITOR.window.decoration.configure((window, context) => {
    const appId = (window.appId() ?? "").toLowerCase();
    const isFirefox =
      appId === "firefox" ||
      appId.endsWith(".firefox") ||
      appId.includes("firefoxdeveloperedition");

    if (appId.length === 0) {
      return { mode: context.clientPreference ?? "client" };
    }

    if (isFirefox) {
      return { mode: "client" };
    }

    return { mode: "server" };
  });
}
