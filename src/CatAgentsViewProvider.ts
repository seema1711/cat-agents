import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import {
  EXTERNAL_SCAN_INTERVAL_MS,
  LAYOUT_DIR,
  LAYOUT_FILE,
  POLL_INTERVAL_MS,
  SETTING_LABELS,
  SETTING_SOUND,
  SETTING_WATCH_ALL,
  STORAGE_KEY_AGENTS,
  TERMINAL_NAME_PREFIX,
} from './constants';
import { getNextAgentId, getProjectDirPath, scanForAgentJsonl } from './agentManager';
import { startFileWatching } from './fileWatcher';
import { AgentState } from './types';

export class CatAgentsViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private agents: Map<number, AgentState> = new Map();
  private fileWatchers: Map<number, NodeJS.Timeout> = new Map();
  private externalScanInterval?: NodeJS.Timeout;
  private readonly context: vscode.ExtensionContext;
  private agentIdCounter = 1;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'dist'),
      ],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message) => {
      this.handleMessage(message);
    });

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.sendExistingAgents();
        this.sendSettings();
      }
    });

    this.restoreAgents();
    this.startExternalScanning();
    this.sendSettings();

    setTimeout(() => {
      this.sendExistingAgents();
    }, 500);
  }

  private handleMessage(message: Record<string, unknown>): void {
    const type = message['type'] as string;
    switch (type) {
      case 'openClaude': {
        const folderName = message['folderName'] as string | undefined;
        this.spawnNewAgent(folderName);
        break;
      }
      case 'focusAgent': {
        const agentId = message['agentId'] as number;
        const agent = this.agents.get(agentId);
        agent?.terminalRef?.show();
        break;
      }
      case 'closeAgent': {
        const agentId = message['agentId'] as number;
        this.closeAgent(agentId);
        break;
      }
      case 'saveLayout': {
        const layout = message['layout'];
        this.saveLayout(layout);
        break;
      }
      case 'setSetting': {
        const key = message['key'] as string;
        const value = message['value'];
        this.context.globalState.update(key, value);
        break;
      }
    }
  }

  private async spawnNewAgent(folderName?: string): Promise<void> {
    const id = getNextAgentId();
    const sessionId = `cat-${Date.now()}-${id}`;
    const folder = folderName ?? vscode.workspace.workspaceFolders?.[0]?.name ?? 'workspace';
    const projectDir = getProjectDirPath(folder);

    const terminal = vscode.window.createTerminal({
      name: `${TERMINAL_NAME_PREFIX} (cat-${id})`,
    });
    terminal.sendText('claude');
    terminal.show();

    const jsonlFile = await scanForAgentJsonl(projectDir, sessionId);
    if (!jsonlFile) return;

    const agent: AgentState = {
      id,
      sessionId,
      folderName: folder,
      projectDir,
      jsonlFile,
      terminalRef: terminal,
      activeTools: new Map(),
      isWaiting: false,
      permissionSent: false,
      inputTokens: 0,
      outputTokens: 0,
    };

    this.agents.set(id, agent);
    this.startWatching(agent);

    this.post({
      type: 'agentCreated',
      agent: {
        id: agent.id,
        sessionId: agent.sessionId,
        folderName: agent.folderName,
      },
    });
  }

  private startWatching(agent: AgentState): void {
    const watcher = startFileWatching(agent, {
      onToolStart: (agentId, toolId, toolName, status) => {
        const a = this.agents.get(agentId);
        if (!a) return;
        a.activeTools.set(toolId, { toolId, toolName, status });
        this.post({ type: 'agentToolStart', agentId, toolId, toolName, status });
      },
      onToolDone: (agentId, toolId) => {
        const a = this.agents.get(agentId);
        if (!a) return;
        a.activeTools.delete(toolId);
        this.post({ type: 'agentToolDone', agentId, toolId });
      },
      onWaiting: (agentId) => {
        const a = this.agents.get(agentId);
        if (!a) return;
        a.isWaiting = true;
        this.post({ type: 'agentStatus', agentId, status: 'waiting' });
      },
      onActive: (agentId) => {
        const a = this.agents.get(agentId);
        if (!a) return;
        a.isWaiting = false;
        this.post({ type: 'agentStatus', agentId, status: 'active' });
      },
      onPermission: (agentId, toolId, toolName) => {
        this.post({ type: 'agentToolPermission', agentId, toolId, toolName });
      },
      onTokens: (agentId, input, output) => {
        const a = this.agents.get(agentId);
        if (!a) return;
        a.inputTokens = input;
        a.outputTokens = output;
        this.post({ type: 'agentTokenUsage', agentId, inputTokens: input, outputTokens: output });
      },
    });
    this.fileWatchers.set(agent.id, watcher);
  }

  private closeAgent(agentId: number): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    const watcher = this.fileWatchers.get(agentId);
    if (watcher) clearInterval(watcher);
    this.fileWatchers.delete(agentId);
    this.agents.delete(agentId);
    this.post({ type: 'agentClosed', agentId });
    this.persistAgents();
  }

  private restoreAgents(): void {
    const persisted = this.context.workspaceState.get<
      Array<{ id: number; sessionId: string; folderName: string; projectDir: string; jsonlFile: string }>
    >(STORAGE_KEY_AGENTS, []);

    for (const p of persisted) {
      if (!fs.existsSync(p.jsonlFile)) continue;
      const agent: AgentState = {
        id: p.id,
        sessionId: p.sessionId,
        folderName: p.folderName,
        projectDir: p.projectDir,
        jsonlFile: p.jsonlFile,
        activeTools: new Map(),
        isWaiting: false,
        permissionSent: false,
        inputTokens: 0,
        outputTokens: 0,
      };
      this.agents.set(agent.id, agent);
      this.startWatching(agent);
    }
  }

  private persistAgents(): void {
    const data = Array.from(this.agents.values()).map((a) => ({
      id: a.id,
      sessionId: a.sessionId,
      folderName: a.folderName,
      projectDir: a.projectDir,
      jsonlFile: a.jsonlFile,
    }));
    this.context.workspaceState.update(STORAGE_KEY_AGENTS, data);
  }

  private sendExistingAgents(): void {
    const agents = Array.from(this.agents.values()).map((a) => ({
      id: a.id,
      sessionId: a.sessionId,
      folderName: a.folderName,
      isWaiting: a.isWaiting,
      activeTools: Array.from(a.activeTools.values()),
      inputTokens: a.inputTokens,
      outputTokens: a.outputTokens,
    }));
    this.post({ type: 'existingAgents', agents });
  }

  private sendSettings(): void {
    const sound = this.context.globalState.get<boolean>(SETTING_SOUND, true);
    const labels = this.context.globalState.get<boolean>(SETTING_LABELS, true);
    const watchAll = this.context.globalState.get<boolean>(SETTING_WATCH_ALL, false);
    const workspaceFolders = vscode.workspace.workspaceFolders?.map((f) => f.name) ?? [];
    this.post({ type: 'settingsLoaded', sound, labels, watchAll, workspaceFolders });
  }

  private startExternalScanning(): void {
    this.externalScanInterval = setInterval(() => {
      this.scanGlobalProjectDirs();
    }, EXTERNAL_SCAN_INTERVAL_MS);
  }

  private scanGlobalProjectDirs(): void {
    const watchAll = this.context.globalState.get<boolean>(SETTING_WATCH_ALL, false);
    if (!watchAll) return;

    const claudeDir = path.join(os.homedir(), '.claude', 'projects');
    try {
      const projects = fs.readdirSync(claudeDir);
      for (const proj of projects) {
        const projPath = path.join(claudeDir, proj);
        try {
          const files = fs.readdirSync(projPath);
          for (const file of files) {
            if (!file.endsWith('.jsonl')) continue;
            const jsonlPath = path.join(projPath, file);
            const alreadyTracked = Array.from(this.agents.values()).some(
              (a) => a.jsonlFile === jsonlPath,
            );
            if (alreadyTracked) continue;
            const id = getNextAgentId();
            const agent: AgentState = {
              id,
              sessionId: file.replace('.jsonl', ''),
              folderName: proj,
              projectDir: projPath,
              jsonlFile: jsonlPath,
              activeTools: new Map(),
              isWaiting: false,
              permissionSent: false,
              inputTokens: 0,
              outputTokens: 0,
            };
            this.agents.set(id, agent);
            this.startWatching(agent);
            this.post({
              type: 'agentCreated',
              agent: { id: agent.id, sessionId: agent.sessionId, folderName: agent.folderName },
            });
          }
        } catch {
          // skip unreadable dirs
        }
      }
    } catch {
      // .claude/projects may not exist
    }
  }

  private saveLayout(layout: unknown): void {
    const workspaceRoot =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? os.homedir();
    const dir = path.join(workspaceRoot, LAYOUT_DIR);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, LAYOUT_FILE), JSON.stringify(layout, null, 2));
  }

  exportDefaultLayout(): void {
    const workspaceRoot =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? os.homedir();
    const dir = path.join(workspaceRoot, LAYOUT_DIR);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const defaultLayout = {
      width: 20,
      height: 11,
      tiles: [],
      furniture: [],
      seats: [],
    };
    const outPath = path.join(dir, LAYOUT_FILE);
    fs.writeFileSync(outPath, JSON.stringify(defaultLayout, null, 2));
    vscode.window.showInformationMessage(`Default layout exported to ${outPath}`);
  }

  private post(message: Record<string, unknown>): void {
    this.view?.webview.postMessage(message);
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const distUri = vscode.Uri.joinPath(
      this.context.extensionUri,
      'webview-ui',
      'dist',
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(distUri, 'assets', 'index.js'),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(distUri, 'assets', 'index.css'),
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="${styleUri}" />
  <title>Cat Agents</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  dispose(): void {
    if (this.externalScanInterval) clearInterval(this.externalScanInterval);
    for (const watcher of this.fileWatchers.values()) clearInterval(watcher);
    this.fileWatchers.clear();
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
