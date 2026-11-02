import { COMPOSITOR, type WaylandWindow } from "shoji_wm";

export function initCliphist() {
  COMPOSITOR.process.service("cliphist-text", {
    command: ["wl-paste", "--type", "text", "--watch", "cliphist", "store"],
    restart: "on-exit",
  });
  COMPOSITOR.process.service("cliphist-image", {
    command: ["wl-paste", "--type", "image", "--watch", "cliphist", "store"],
    restart: "on-exit",
  });
}
