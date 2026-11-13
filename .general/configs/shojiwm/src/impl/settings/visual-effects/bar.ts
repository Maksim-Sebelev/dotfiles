import { COMPOSITOR } from "shoji_wm";
import { type GlobalConfig } from "../global-config";

export enum Bar {
  Nothing,
  ShojiBar2, ShojiBar3, ShojiBar4,
  Waybar,
}

export function initBar(config: GlobalConfig) {
  switch (config.bar) {
  case Bar.ShojiBar2:
    COMPOSITOR.process.once("shell", {
      command: "cd ~/.config/shoji-bar-2 && ags run app.tsx",
      runPolicy: "once-per-session",
    });
    break;
  case Bar.ShojiBar3:
    COMPOSITOR.process.once("shell", {
      command: "cd ~/.config/shoji-bar-3 && bash build.sh; exec quickshell --path .",
      runPolicy: "once-per-session",
    });
    break;
  case Bar.Waybar:
    COMPOSITOR.process.once("shell", {
      command: "waybar",
      runPolicy: "once-per-session",
    });
    break;
  case Bar.Nothing:
    break;
  default:
    console.error(`Not implemented now`)
    break;
  }
}
