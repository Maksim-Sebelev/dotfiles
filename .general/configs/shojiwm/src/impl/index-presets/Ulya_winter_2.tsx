import { COMPOSITOR } from "shoji_wm";
import { initAll } from "./impl/settings/init";
import { Preset, getConfig } from "./impl/settings/presets";

initAll(getConfig(Preset.Ulya_winter_2));

export default COMPOSITOR;
