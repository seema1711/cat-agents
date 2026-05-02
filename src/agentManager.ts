import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { TERMINAL_NAME_PREFIX } from './constants';
import { AgentState } from './types';

let nextAgentId = 1;

export function getNextAgentId(): number {
  return nextAgentId++;
}

export function getProjectDirPath(folderName: string): string {
  const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects');
  if (fs.existsSync(claudeProjectsDir)) {
    const entries = fs.readdirSync(claudeProjectsDir);
    const match = entries.find(
      (e) => e.toLowerCase() === folderName.toLowerCase(),
    );
    if (match) return path.join(claudeProjectsDir, match);
  }
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders) {
    const wf = workspaceFolders.find(
      (f) => f.name.toLowerCase() === folderName.toLowerCase(),
    );
    if (wf) {
      const encoded = wf.uri.fsPath.replace(/\//g, '-').replace(/^-/, '');
      return path.join(os.homedir(), '.claude', 'projects', encoded);
    }
  }
  return path.join(os.homedir(), '.claude', 'projects', folderName);
}

export function launchNewTerminal(
  sessionId: string,
  projectDir: string,
): vscode.Terminal {
  const name = `${TERMINAL_NAME_PREFIX} (${sessionId.slice(0, 8)})`;
  const terminal = vscode.window.createTerminal({ name });
  terminal.sendText(`claude --session-id ${sessionId}`);
  return terminal;
}

export function removeAgent(
  agent: AgentState,
  fileWatchers: Map<number, NodeJS.Timeout>,
): void {
  const watcher = fileWatchers.get(agent.id);
  if (watcher) {
    clearInterval(watcher);
    fileWatchers.delete(agent.id);
  }
}

export function findJsonlForSession(
  projectDir: string,
  sessionId: string,
): string | undefined {
  try {
    const files = fs.readdirSync(projectDir);
    const match = files.find((f) => f.includes(sessionId) && f.endsWith('.jsonl'));
    return match ? path.join(projectDir, match) : undefined;
  } catch {
    return undefined;
  }
}

export function scanForAgentJsonl(
  projectDir: string,
  sessionId: string,
  maxWaitMs = 15000,
): Promise<string | undefined> {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      const found = findJsonlForSession(projectDir, sessionId);
      if (found) return resolve(found);
      if (Date.now() - start > maxWaitMs) return resolve(undefined);
      setTimeout(check, 500);
    };
    check();
  });
}
