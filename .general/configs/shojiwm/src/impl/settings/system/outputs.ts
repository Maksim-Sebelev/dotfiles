import { COMPOSITOR, type DisplayConfigDraft } from "shoji_wm";

export function initOutputs(): void {
  COMPOSITOR.output.configure((context) => {
    const display: DisplayConfigDraft = {};

    display["eDP-1"] = {
      mode: "extend",
      resolution: "best",
      position: "auto",
      scale: 1.8,
    };
    display["eDP-2"] = {
      mode: "extend",
      resolution: "best",
      position: "auto",
      scale: 1.8,
    };
    display["HDMI-A-1"] = {
      mode: "extend",
      resolution: "best",
      position: "auto",
      scale: 1.5,
    };
    display["DP-1"] = {
      mode: "extend",
      resolution: "best",
      position: "auto",
      scale: 1.5,
    };
    display["DP-4"] = {
      mode: "extend",
      resolution: "best",
      position: "auto",
      scale: 1.5,
    };
    display["DP-2"] = {
      mode: "extend",
      resolution: "best",
      position: "auto",
      scale: 1.6,
    };

    const isDocked = context.connected.some(
      (output) => output.name === "HDMI-A-1",
    );
    if (isDocked) {
      display["eDP-1"] = { mode: "disabled" };
      display["eDP-2"] = { mode: "disabled" };
    }

    return display;
  });
}
