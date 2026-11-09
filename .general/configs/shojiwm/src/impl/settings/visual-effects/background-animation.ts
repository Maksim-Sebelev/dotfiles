import {
  compileLayerEffect,
  dualKawaseBlur,
  layerSource,
  loadShader,
  shaderStage,
} from "shoji_wm";
import type { LayerEffectHandle } from "shoji_wm/types";
import { acquireClock } from "./../system/animation-clock";

export enum BackgroundAnimation {
  Nothing,
  LightBlur, MiddleBlur, HardBlur,
  Rain_1, Rain_2, Rain_3, Rain_4,
  Snow_with_blur_1, Snow_with_blur_2, Snow_with_blur_3,
  Snow_without_blur_1, Snow_without_blur_2, Snow_without_blur_3,
  Sunshine_1, Sunshine_2,
  Synthway_day, Synthway_night,
  Plasma,
  Bubbles
}

interface BackgroundInstance {
  animation: BackgroundAnimation;
  effect: LayerEffectHandle;
  clock: ReturnType<typeof acquireClock>;
}

const instances = new Map<string, BackgroundInstance>();

export function backgroundAnimation(
  outputName: string,
  animation: BackgroundAnimation,
): LayerEffectHandle {
  let instance = instances.get(outputName);
  if (instance && instance.animation !== animation) {
    instance.effect.dispose?.();
    instance.clock.release();
    instances.delete(outputName);
    instance = undefined;
  }
  if (!instance) {
    const clock = acquireClock(outputName);
    instance = { 
      animation, 
      effect: createInstance(outputName, animation, clock), 
      clock 
    };
    instances.set(outputName, instance);
  }
  return instance.effect;
}

function createInstance(
  _outputName: string,
  animation: BackgroundAnimation,
  clock: ReturnType<typeof acquireClock>,
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
    pipeline: getPipeline(animation, clock),
  });
}

function getPipeline(
  animation: BackgroundAnimation,
  clock: ReturnType<typeof acquireClock>
) {
  const RAIN_BACKGROUND_ANGLE_DEG = 15;
  const RAIN_BACKGROUND_SPEED = 5.0;

  switch (animation) {
    case BackgroundAnimation.LightBlur:
      return [dualKawaseBlur({ radius: 1, passes: 2 })];

    case BackgroundAnimation.MiddleBlur:
      return [dualKawaseBlur({ radius: 2, passes: 3 })];

    case BackgroundAnimation.HardBlur:
      return [dualKawaseBlur({ radius: 3, passes: 3 })];

    case BackgroundAnimation.Rain_1:
      return [
        dualKawaseBlur({ radius: 2, passes: 2 }),
        shaderStage(loadShader("./src/impl/shaders/background/rain/1.frag"), {
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
        shaderStage(loadShader("./src/impl/shaders/background/rain/2.frag"), {
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
        shaderStage(loadShader("./src/impl/shaders/background/rain/3.frag"), {
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
        shaderStage(loadShader("./src/impl/shaders/background/rain/4.frag"), {
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
        shaderStage(loadShader("./src/impl/shaders/background/synthway/1.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: 10.0,
            road_color: [0.35, 0.30, 0.45],
            sky_color: [0.45, 0.55, 0.95],
            sun_color: [1.00, 0.85, 0.55],
            horizon_color: [1.00, 0.65, 0.75],
          },
        }),
      ];

    case BackgroundAnimation.Synthway_night:
      return [
        shaderStage(loadShader("./src/impl/shaders/background/synthway/1.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: 10.0,
            road_color: [0.70, 0.05, 0.85],
            sky_color: [0.161, 0.067, 0.678],
            sun_color: [1.00, 0.8, 1.0],
            horizon_color: [0.161, 0.067, 0.678],
          },
        }),
      ];
      
    case BackgroundAnimation.Snow_without_blur_1:
      return [
        shaderStage(loadShader("./src/impl/shaders/background/snow/1.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: 1.0,
            snow_amount: 1.0,
            wind_strength: 0.5,
          },
        }),
      ];
      
    case BackgroundAnimation.Snow_without_blur_2:
      return [
        shaderStage(loadShader("./src/impl/shaders/background/snow/2.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: 1.0,
            snow_amount: 1.0,
            wind_strength: 0.5,
            snow_opacity: 1.0,
          },
        }),
      ];
      
    case BackgroundAnimation.Snow_without_blur_3:
      return [
        shaderStage(loadShader("./src/impl/shaders/background/snow/3.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: 1.0,
            snow_amount: 1.0,
            wind_strength: 0.5,
            snow_opacity: 1.0,
          },
        }),
      ];
      
    case BackgroundAnimation.Snow_with_blur_1:
      return [
        dualKawaseBlur({ radius: 1, passes: 2 }),
        shaderStage(loadShader("./src/impl/shaders/background/snow/1.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: 1.0,
            snow_amount: 1.0,
            wind_strength: 0.5,
          },
        }),
      ];
      
    case BackgroundAnimation.Snow_with_blur_2:
      return [
        dualKawaseBlur({ radius: 1, passes: 2 }),
        shaderStage(loadShader("./src/impl/shaders/background/snow/2.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: 1.0,
            snow_amount: 1.0,
            wind_strength: 0.5,
            snow_opacity: 1.0,
          },
        }),
      ];
      
    case BackgroundAnimation.Snow_with_blur_3:
      return [
        dualKawaseBlur({ radius: 1, passes: 2 }),
        shaderStage(loadShader("./src/impl/shaders/background/snow/3.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: 1.0,
            snow_amount: 1.2,
            wind_strength: 0.5,
            snow_opacity: 1.2,
          },
        }),
      ];
      
    case BackgroundAnimation.Sunshine_1:
      return [
        shaderStage(loadShader("./src/impl/shaders/background/sunshine/1.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            light_position: [-0.05, 1.05],
            flare_intensity: 0.6,
            speed: 0.2,
            flicker_intensity: 1.0,
          },
        }),
      ];
      
    case BackgroundAnimation.Sunshine_2:
      return [
        shaderStage(loadShader("./src/impl/shaders/background/sunshine/1.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            light_position: [0.16, 0.9],
            flare_intensity: 0.4,
            speed: 0.4,
            flicker_intensity: 1.0,
          },
        }),
      ];
      
    case BackgroundAnimation.Plasma:
      return [
        shaderStage(loadShader("./src/impl/shaders/background/plasma/1.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: 10,
            glow_color: [0.70, 0.05, 0.85],
            core_color: [0.70, 0.05, 0.85],
            bg_color: [0.70, 0.05, 0.85],
          },
        }),
      ];
      
    case BackgroundAnimation.Bubbles:
      return [
        shaderStage(loadShader("./src/impl/shaders/background/bubbles/1.frag"), {
          uniforms: {
            time: clock.time,
            aspect: clock.aspect,
            speed: 0.5,
            angle_deg: 0,
            opacity: 1.0,
            bubble_color1: [0.94, 0.3, 0.0],
            bubble_color2: [0.1, 0.4, 0.8],
          },
        }),
      ];
      
    default:
      console.warn(`No shader for animation ${animation}`);
      return [];
  }
}

export function disposeBackgroundAnimation() {
  for (const instance of instances.values()) {
    instance.effect.dispose?.();
    instance.clock.release();
  }
  instances.clear();
}
