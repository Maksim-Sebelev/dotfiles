import { COMPOSITOR } from "shoji_wm";
import { type OutlookConfig } from "../visual-effects-config";

export enum Bar {
  Nothing,
  ShojiBar2, ShojiBar3,
  Waybar,
}

export function initBar(config: OutlookConfig) {
  switch (config.bar) {
  case Bar.ShojiBar2:
    COMPOSITOR.process.once("shell", {
      command: "cd /home/ananasik/.config/shoji-bar-2 &&  nix shell github:aylur/ags#agsFull --offline --command ags run app.tsx",
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
    console.error(`Unknown bar type.`)
    break;
  }
}
