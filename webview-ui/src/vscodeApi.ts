import { isBrowserRuntime } from './runtime';

interface VsCodeApi {
  postMessage(message: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

function createVsCodeApi(): VsCodeApi {
  if (isBrowserRuntime) {
    return {
      postMessage(message: unknown) {
        console.log('[vscode.postMessage]', message);
      },
    };
  }
  return acquireVsCodeApi();
}

export const vscode = createVsCodeApi();
