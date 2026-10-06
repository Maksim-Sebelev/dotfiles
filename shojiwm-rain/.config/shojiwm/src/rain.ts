import {
  COMPOSITOR,
  compileEffect,
  compileLayerEffect,
  createPoll,
  dualKawaseBlur,
  backdropSource,
  layerSource,
  loadShader,
  shaderStage,
  signal,
  type PollHandle,
  type WaylandWindow,
} from "shoji_wm";
import type { LayerEffectHandle } from "shoji_wm/types";

const RAIN_ANGLE_DEG = -10;
const RAIN_BACKGROUND_SPEED = -3.0;
const RAIN_WINDOW_SPEED = RAIN_BACKGROUND_SPEED * 0.7;

const POLL_INTERVAL_MS = 16;

const instances = new Map<string, RainInstance>();
let poll: PollHandle | null = null;
let pollLastNowMs: number | null = null;

const [timeSig, setTime] = signal(0);

const [aspectSig, setAspect] = signal(16 / 9);

interface RainInstance {
  effect: LayerEffectHandle;
}

const RAIN_AMOUNT_WALLPAPER = 0.6;

export function rainWindowWallpaperEffect(outputName: string): LayerEffectHandle {
  let instance = instances.get(outputName);
  if (!instance) {
    instance = createInstance(outputName);
    instances.set(outputName, instance);
    startPoll();
  }
  return instance.effect;
}
const RAIN_STREAK_LENGTH = 10;
const RAIN_SPLASHES = 1.0;

function createInstance(_outputName: string): RainInstance {
  const effect = compileLayerEffect({
    input: layerSource(),
    invalidate: { kind: "always" },
    alpha: "opaque",
    pipeline: [
      dualKawaseBlur({ radius: 2, passes: 2}),
      shaderStage(loadShader("./rain.frag"), {
        uniforms: {
          time: timeSig,
          speed: 8.0,
          rain_amount: RAIN_AMOUNT_WALLPAPER,
          aspect: aspectSig,
          angle_deg: RAIN_ANGLE_DEG,
          streak_length: RAIN_STREAK_LENGTH,
          splashes: 0.0,
        },
      }),
    ],
  });
  return { effect };
}

function startPoll() {
  if (poll && !poll.cancelled) {
    return;
  }
  pollLastNowMs = null;
  poll = createPoll(POLL_INTERVAL_MS, tick);
}

function tick(handle: PollHandle) {
  const nowMs = handle.nowMs;
  const deltaMs =
    pollLastNowMs === null ? POLL_INTERVAL_MS : nowMs - pollLastNowMs;
  pollLastNowMs = nowMs;

  // time в секундах, монотонно растёт. mod 600 — чтобы float16 не терял
  // точность через час.
  setTime((nowMs / 1000) % 600);

  // Обновляем аспект по первому output'у. Дождь синхронный, так что
  // одного значения хватает; если мониторы очень разные — можно
  // сделать по сигналу на output и подавать в соответствующий effect.
  const outputs = COMPOSITOR.output.list;
  if (outputs.length > 0) {
    const out = COMPOSITOR.output.get(outputs[0]);
    if (out && out.resolution && out.scale) {
      const w = out.resolution.width / out.scale;
      const h = out.resolution.height / out.scale;
      if (h > 0) setAspect(w / h);
    }
  }
}

const windowInstances = new Map<string, LayerEffectHandle>();

const RAIN_AMOUNT_WINDOW = 0.6;

export function rainWindowWindowEffect(window: WaylandWindow): LayerEffectHandle {
  let effect = windowInstances.get(window.id);
  if (!effect) {
    effect = compileEffect({
      input: backdropSource(),
      capturePadding: 24,
      invalidate: { kind: "always" },
      alpha: "opaque",
      pipeline: [
        dualKawaseBlur({ radius: 1, passes: 2 }),
        shaderStage(loadShader("./rain-window.frag"), {
          uniforms: {
            time: timeSig,
            speed: RAIN_ANGLE_DEG,
            rain_amount: RAIN_AMOUNT_WINDOW,
            aspect: aspectSig,
            angle_deg: RAIN_ANGLE_DEG,
          },
        }),
      ],
    });
    windowInstances.set(window.id, effect);
    startPoll();
  }
  return effect;
}

/**
 * Остановить полл и сбросить состояние. Вызывается из COMPOSITOR.onDisable
 * при выгрузке конфига, чтобы не оставлять висящий полл.
 */
export function disposeRain() {
  if (poll && !poll.cancelled) {
    poll.cancel();
  }
  poll = null;
  pollLastNowMs = null;
  instances.clWindowear();
}
