import * as vscode from 'vscode';

export interface ToolStatus {
  toolId: string;
  toolName: string;
  status: string;
  isSubagent?: boolean;
}

export interface AgentState {
  id: number;
  sessionId: string;
  folderName: string;
  projectDir: string;
  jsonlFile: string;
  terminalRef?: vscode.Terminal;
  activeTools: Map<string, ToolStatus>;
  isWaiting: boolean;
  permissionSent: boolean;
  inputTokens: number;
  outputTokens: number;
  teamName?: string;
  agentName?: string;
  isTeamLead?: boolean;
  leadAgentId?: number;
}

export interface PersistedAgent {
  id: number;
  sessionId: string;
  folderName: string;
  projectDir: string;
  jsonlFile: string;
  terminalName?: string;
  teamName?: string;
  agentName?: string;
  isTeamLead?: boolean;
  leadAgentId?: number;
}
