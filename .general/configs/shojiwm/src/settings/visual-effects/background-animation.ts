import {
  compileLayerEffect,
  dualKawaseBlur,
  layerSource,
  loadShader,
  shaderStage,
} from "shoji_wm";
import type { LayerEffectHandle } from "shoji_wm/types";
import { acquireClock } from "./../system/animation-clock";

const clock = acquireClock();

export enum BackgroundAnimation {
  Nothing,
  BlurOnly,
  Rain_1, Rain_2, Rain_3, Rain_4,
  Snow_1,
  Synthway_day, Synthway_night
}

interface BackgroundInstance {
  animation: BackgroundAnimation;
  effect: LayerEffectHandle;
}

const instances = new Map<string, BackgroundInstance>();

export function backgroundAnimation(
  outputName: string,
  animation: BackgroundAnimation,
): LayerEffectHandle {
  let instance = instances.get(outputName);
  if (instance && instance.animation !== animation) {
    instance.effect.dispose?.();
    instances.delete(outputName);
    instance = undefined;
  }
  if (!instance) {
    instance = { animation, effect: createInstance(outputName, animation) };
    instances.set(outputName, instance);
  }
  return instance.effect;
}

function createInstance(
  _outputName: string,
  animation: BackgroundAnimation,
): LayerEffectHandle {
  if (animation === BackgroundAnimation.Nothing) {
    return compileLayerEffect({
      input: layerSource(),
      invalidate: { kind: "always" },
      alpha: "opaque",
      pipeline: [],
    });
  }

  return compileLayerEffect({
    input: layerSource(),
    invalidate: { kind: "always" },
    alpha: "opaque",
    pipeline: getPipeline(animation),
  });
}

function getPipeline(animation: BackgroundAnimation) {
  const RAIN_BACKGROUND_ANGLE_DEG = 15;
  const RAIN_BACKGROUND_SPEED = 5.0;

  switch (animation) {
    case BackgroundAnimation.BlurOnly:
      return [dualKawaseBlur({ radius: 1, passes: 2 })];

    case BackgroundAnimation.Rain_1:
      return [
        dualKawaseBlur({ radius: 2, passes: 2 }),
        shaderStage(loadShader("./src/shaders/background/rain/1.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: RAIN_BACKGROUND_SPEED,
            angle_deg: RAIN_BACKGROUND_ANGLE_DEG * 2,
            rain_amount: 0.8,
            streak_length: 10,
            splashes: 0,
          },
        }),
      ];

    case BackgroundAnimation.Rain_2:
      return [
        shaderStage(loadShader("./src/shaders/background/rain/2.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: RAIN_BACKGROUND_SPEED,
            angle_deg: RAIN_BACKGROUND_ANGLE_DEG,
            rain_amount: 0.6,
            streak_length: 10,
            rain_opacity: 0.4,
            splash_opacity: 1.0,
          },
        }),
      ];

    case BackgroundAnimation.Rain_3:
      return [
        shaderStage(loadShader("./src/shaders/background/rain/3.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: RAIN_BACKGROUND_SPEED,
            angle_deg: RAIN_BACKGROUND_SPEED,
            rain_amount: 10,
            streak_length: 5,
            splashes: 0.0,
          },
        }),
      ];

    case BackgroundAnimation.Rain_4:
      return [
        shaderStage(loadShader("./src/shaders/background/rain/4.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: RAIN_BACKGROUND_SPEED,
            angle_deg: RAIN_BACKGROUND_ANGLE_DEG,
            rain_amount: 10,
            streak_length: 5,
            splashes: 0.0,
          },
        }),
      ];

    case BackgroundAnimation.Synthway_day:
      return [
        shaderStage(loadShader("./src/shaders/background/synthway/1.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: 10.0,
            road_color:    [0.35, 0.30, 0.45],
            sky_color:     [0.45, 0.55, 0.95],
            sun_color:     [1.00, 0.85, 0.55],
            horizon_color: [1.00, 0.65, 0.75],
          },
        }),
      ];

    case BackgroundAnimation.Synthway_night:
      return [
        shaderStage(loadShader("./src/shaders/background/synthway/1.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: 10.0,
            road_color:    [0.70, 0.05, 0.85],
            sky_color:     [0.161, 0.067, 0.678],
            sun_color:     [1.00, 0.8, 1.0],
            horizon_color: [0.161, 0.067, 0.678],
          },
        }),
      ];
    case BackgroundAnimation.Snow_1:
      return [
        // Необязательно: лёгкий блюр для смягчения обоев
        dualKawaseBlur({ radius: 1, passes: 2 }),
        shaderStage(loadShader("./src/shaders/background/snow/1.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: 1.0,
            snow_amount: 1.0,
            wind_strength: 0.5,
          },
        }),
      ];
    default:
      console.warn(`No shader for animation ${animation}`);
      return [];
  }
}

// ---------------------------------------------------------------------------
// Dispose
// ---------------------------------------------------------------------------
export function disposeBackgroundAnimation() {
  clock.release();
  for (const instance of instances.values()) {
    instance.effect.dispose?.();
  }
  instances.clear();
}
