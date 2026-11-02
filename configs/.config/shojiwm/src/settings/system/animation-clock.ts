import {
  COMPOSITOR,
  createPoll,
  signal,
  type PollHandle,
} from "shoji_wm";

const POLL_INTERVAL_MS = 16;
const TIME_WRAP_SECONDS = 600;

const [timeSig, setTime] = signal(0);
const [aspectSig, setAspect] = signal(16 / 9);

let poll: PollHandle | null = null;
let pollLastNowMs: number | null = null;
let refCount = 0;

export function acquireClock(): {
  time: typeof timeSig;
  aspect: typeof aspectSig;
  release: () => void;
} {
  refCount++;
  ensurePoll();

  let released = false;
  return {
    time: timeSig,
    aspect: aspectSig,
    release() {
      if (released) return;
      released = true;
      refCount--;
      if (refCount <= 0) {
        stopPoll();
      }
    },
  };
}

function ensurePoll() {
  if (poll && !poll.cancelled) return;
  pollLastNowMs = null;
  poll = createPoll(POLL_INTERVAL_MS, tick);
}

function stopPoll() {
  if (poll && !poll.cancelled) {
    poll.cancelled = true; // или poll.cancel?.() — зависит от API
  }
  poll = null;
  pollLastNowMs = null;
}

function tick(handle: PollHandle) {
  const nowMs = handle.nowMs;
  pollLastNowMs = nowMs;

  setTime((nowMs / 1000) % TIME_WRAP_SECONDS);

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
