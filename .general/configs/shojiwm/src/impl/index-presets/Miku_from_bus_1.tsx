import { COMPOSITOR } from "shoji_wm";
import { initAll } from "./impl/settings/init";
import { Preset, getConfig } from "./impl/settings/presets";

initAll(getConfig(Preset.Miku_from_bus_1));

export default COMPOSITOR;
