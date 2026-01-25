/// <reference lib="webworker" />

import { createEngineWorkerHost } from "./engineWorkerHost";
import type { EngineWorkerToWorkerMessage } from "./engineWorkerHost";

const host = createEngineWorkerHost({
  postMessage: (msg) => {
    self.postMessage(msg);
  },
});

self.onmessage = (ev: MessageEvent<EngineWorkerToWorkerMessage>) => {
  host.handleMessage(ev.data);
};
