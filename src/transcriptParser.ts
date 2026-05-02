import { AgentState, ToolStatus } from './types';
import { TEXT_IDLE_DELAY_MS } from './constants';

const SKIP_PERMISSION_TOOLS = new Set(['Task', 'Agent', 'AskUserQuestion']);

export function processTranscriptLine(
  line: string,
  agent: AgentState,
  onToolStart: (toolId: string, toolName: string, status: string) => void,
  onToolDone: (toolId: string) => void,
  onWaiting: () => void,
  onActive: () => void,
  onPermission: (toolId: string, toolName: string) => void,
  onTokens: (input: number, output: number) => void,
): void {
  let record: Record<string, unknown>;
  try {
    record = JSON.parse(line);
  } catch {
    return;
  }

  const type = record['type'] as string | undefined;

  if (type === 'assistant') {
    const message = record['message'] as Record<string, unknown> | undefined;
    const usage = message?.['usage'] as Record<string, unknown> | undefined;
    if (usage) {
      const input = (usage['input_tokens'] as number) ?? 0;
      const output = (usage['output_tokens'] as number) ?? 0;
      onTokens(input, output);
    }

    const content = message?.['content'] as unknown[] | undefined;
    content?.forEach((block) => {
      const b = block as Record<string, unknown>;
      if (b['type'] === 'tool_use') {
        const toolId = b['id'] as string;
        const toolName = b['name'] as string;
        onToolStart(toolId, toolName, toolName);
        onActive();

        if (!SKIP_PERMISSION_TOOLS.has(toolName)) {
          const timer = setTimeout(() => {
            if (agent.activeTools.has(toolId)) {
              onPermission(toolId, toolName);
            }
          }, TEXT_IDLE_DELAY_MS);
          void timer;
        }
      }
    });
  }

  if (type === 'tool_result') {
    const toolUseId = record['tool_use_id'] as string | undefined;
    if (toolUseId) {
      onToolDone(toolUseId);
    }
  }

  if (type === 'user' && record['session_id']) {
    onWaiting();
  }

  const teamInfo = record['team'] as Record<string, unknown> | undefined;
  if (teamInfo) {
    if (teamInfo['name']) agent.teamName = teamInfo['name'] as string;
    if (teamInfo['agent_name']) agent.agentName = teamInfo['agent_name'] as string;
    if (typeof teamInfo['is_lead'] === 'boolean') agent.isTeamLead = teamInfo['is_lead'] as boolean;
  }
}

export function makeToolStatus(toolName: string): ToolStatus {
  return {
    toolId: '',
    toolName,
    status: toolName,
  };
}
