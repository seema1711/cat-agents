import * as fs from 'fs';
import { AgentState } from './types';
import { processTranscriptLine } from './transcriptParser';

interface FileWatcherCallbacks {
  onToolStart: (agentId: number, toolId: string, toolName: string, status: string) => void;
  onToolDone: (agentId: number, toolId: string) => void;
  onWaiting: (agentId: number) => void;
  onActive: (agentId: number) => void;
  onPermission: (agentId: number, toolId: string, toolName: string) => void;
  onTokens: (agentId: number, input: number, output: number) => void;
}

export function startFileWatching(
  agent: AgentState,
  callbacks: FileWatcherCallbacks,
): NodeJS.Timeout {
  let lastSize = 0;

  try {
    const stat = fs.statSync(agent.jsonlFile);
    lastSize = stat.size;
  } catch {
    // file may not exist yet
  }

  const interval = setInterval(() => {
    try {
      const stat = fs.statSync(agent.jsonlFile);
      if (stat.size <= lastSize) return;

      const fd = fs.openSync(agent.jsonlFile, 'r');
      const buf = Buffer.alloc(stat.size - lastSize);
      fs.readSync(fd, buf, 0, buf.length, lastSize);
      fs.closeSync(fd);
      lastSize = stat.size;

      const newLines = buf.toString('utf8').split('\n').filter((l) => l.trim());
      for (const line of newLines) {
        processTranscriptLine(
          line,
          agent,
          (toolId, toolName, status) => callbacks.onToolStart(agent.id, toolId, toolName, status),
          (toolId) => callbacks.onToolDone(agent.id, toolId),
          () => callbacks.onWaiting(agent.id),
          () => callbacks.onActive(agent.id),
          (toolId, toolName) => callbacks.onPermission(agent.id, toolId, toolName),
          (input, output) => callbacks.onTokens(agent.id, input, output),
        );
      }
    } catch {
      // file may have been deleted
    }
  }, 500);

  return interval;
}
