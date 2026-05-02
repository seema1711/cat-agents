declare function acquireVsCodeApi(): unknown;

type Runtime = 'vscode' | 'browser';

function detectRuntime(): Runtime {
  try {
    return typeof acquireVsCodeApi === 'function' ? 'vscode' : 'browser';
  } catch {
    return 'browser';
  }
}

export const isBrowserRuntime = detectRuntime() === 'browser';
